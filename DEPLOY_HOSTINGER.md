# Deploy FW Dental on a Hostinger VPS

Run one Next.js process, one NestJS process, and PostgreSQL on the same VPS. Expose only HTTPS and the HTTP redirect through Nginx. Restrict SSH to administrators, bind the app processes to loopback, and keep PostgreSQL off the public network. Use a patched Node.js 24 LTS release (24.11 or newer). Run the first deployment against a separate staging domain and database with dummy records.

## Prepare PostgreSQL

Use an owner account for migrations and a separate login for the application. Apply the versioned files in `backend/db/migration` in numeric order to an empty database, one transaction per file. Run the following from the repository root on Ubuntu.

```bash
set -euo pipefail
for file in $(printf '%s\n' backend/db/migration/V*.sql | sort -V); do
  psql -X --set ON_ERROR_STOP=on --single-transaction --dbname fw_dental --file "$file"
done
```

The V1–V4 baseline is for initial setup on an empty database. The migration account must be able to install `pgcrypto` and `btree_gist`. If you already applied an earlier development baseline and need to carry over data, plan and verify the transfer on a restored copy before deploying.

Provision the first production administrator with an address controlled by the clinic. The script adds an account with no password. Use **Forgot password?** on the staging or production login page to activate it by email.

```bash
psql -X --dbname fw_dental --file backend/db/bootstrap-admin.sql
```

As the database owner, create the runtime login and choose its password with `\password fw_dental_app` in psql. Keep the runtime login out of the owner and superuser roles.

```sql
CREATE ROLE fw_dental_app LOGIN;
GRANT CONNECT ON DATABASE fw_dental TO fw_dental_app;
GRANT USAGE ON SCHEMA auth, public, logging TO fw_dental_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON auth.users, auth.roles, auth.user_roles TO fw_dental_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors, public.services,
  public.patients, public.bookings, public.transactions, public.transaction_items,
  public.employees, public.absences, public.app_settings TO fw_dental_app;
GRANT INSERT ON logging.events TO fw_dental_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA logging TO fw_dental_app;
```

## Build and start the release

Use `npm ci` in each project before building. Set `BACKEND_URL=http://127.0.0.1:3001` at build and runtime for Next.js. Run `npm audit --omit=dev` in each project as a release check. After a successful build, install only production dependencies in the runtime release directory with `npm ci --omit=dev`.

Use systemd to run each process under a dedicated unprivileged service account. Set `WorkingDirectory` to the matching project in the release, `Restart=on-failure`, and `EnvironmentFile` to a private systemd environment file. Run the backend with `node dist/main` and the frontend with `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3000`. Use absolute executable paths in the systemd units.

| Backend environment | Value |
| --- | --- |
| `NODE_ENV`, `TZ`, `BIND_HOST`, `PORT` | `production`, `Asia/Jakarta`, `127.0.0.1`, `3001` |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE` | `127.0.0.1`, `5432`, `fw_dental` |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_SYNCHRONIZE` | Runtime login and its secret, `false` |
| `JWT_SECRET` | Independent random secret of at least 32 characters |
| `PUBLIC_APP_URL` | Exact public HTTPS origin, such as `https://clinic.example.com` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Clinic mail sender with TLS and a working verified sender address |
| `NOTIFICATION_WEBHOOK_SECRET` | Independent random secret, for example 32 bytes encoded as hex |
| `WEBHOOK_URL` | `http://127.0.0.1:3000/api/webhooks/notifications` |
| `TRUSTED_PROXY_ADDRESSES` | `127.0.0.1/32` with the Nginx setup below |

The frontend needs `NODE_ENV=production`, `TZ=Asia/Jakarta`, `BACKEND_URL=http://127.0.0.1:3001`, `TRUST_INGRESS_CLIENT_IP=true`, and the same `NOTIFICATION_WEBHOOK_SECRET`. Enable ingress IP trust only while Next.js accepts connections from the local trusted proxy and that proxy replaces `X-Real-IP` with the connection address. Keep environment files out of version control and the web root.

## Configure Nginx and TLS

Replace the host and certificate paths with the staging or production values. Provision the certificate before enabling the TLS block. This config assumes clients connect directly to Nginx. An upstream CDN needs its own authenticated client-IP configuration.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name clinic.example.com;
    return 308 https://clinic.example.com$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name clinic.example.com;

    ssl_certificate /etc/letsencrypt/live/clinic.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/clinic.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 128k;
    add_header Strict-Transport-Security "max-age=31536000" always;

    proxy_http_version 1.1;
    proxy_set_header Connection "";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-Port 443;
    proxy_set_header Forwarded "";

    location ^~ /api/webhooks/ {
        return 404;
    }

    location = /api/notifications/sse {
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 75s;
        proxy_pass http://127.0.0.1:3000;
    }

    location ~ ^/api/clinic/(bookings(/available-slots)?|services|auth/(forgot-password|reset-password))$ {
        rewrite ^/api/clinic/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:3001;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

Run `nginx -t` before reloading. Check certificate renewal and confirm the PostgreSQL, NestJS, and Next.js ports are unreachable from the internet.

## Verify before accepting patient data

1. Run the backend unit tests, HTTP E2E tests, and `npm run test:postgres` on a local PostgreSQL instance. The PostgreSQL test creates and drops its own randomly named database. It needs a local test login that can create databases and enable the extension. It uses a mail test double.
2. On staging, activate an administrator through a real email reset. Verify the link uses the staging origin, the same link can only be used once, the old password fails, and an earlier staff session returns 401. Check that the SMTP provider preserves the link fragment and that test email click tracking does not rewrite the token.
3. With dummy records, verify public booking, schedule, checkout and notifications. Confirm that the webhook is private and public booking and login rate limits use the actual client IP. Test permission changes with two staff accounts. Confirm clinic-local dates and attendance reminders around the date boundary.
4. Schedule encrypted off-server database backups with access limited to authorized operators. Restore a backup into a separate database and verify staff, bookings, transactions, and the current migration version. Document the clinic's restore objectives, data retention and access policy, and rehearse recovery before accepting patient data.
5. Monitor process health, disk space, backup success, mail failures, and unexpected 5xx rates. Set retention for `logging.events` and proxy logs. Keep reset links, cookies, Authorization headers, request bodies, and patient identifiers out of operational logs.

For rollback, stop writes and keep a fresh backup before choosing an application-only rollback or database recovery. Keep the slot-exclusion constraint and credential revocation in place. Restoring an earlier database snapshot can lose writes made after the snapshot and can reintroduce old credential state. Test rollback against staging before production.

