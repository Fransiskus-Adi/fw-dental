This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Before signing in locally, start the NestJS backend by running `run_backend.bat`
from the repository root. Wait for it to report that it is listening on
`http://localhost:3001`. If the backend cannot start, check the database setup
in the [backend README](../backend/README.md).

Run the frontend development server from the `frontend` directory:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Mobile and PWA deployment

- Serve the frontend over HTTPS so phones can install the app and grant location access. The worker registers in a production build.
- Set `BACKEND_URL` for the frontend at build and runtime if NestJS is hosted elsewhere. The frontend sends clinic requests through `/api/clinic` on its own origin.
- If deploying behind a reverse proxy, have the public ingress replace incoming `X-Forwarded-For` with the actual client IP and restrict the Next.js and NestJS upstreams to their trusted callers. Set the backend’s `TRUSTED_PROXY_ADDRESSES` to those proxy addresses or CIDRs so booking rate limits use the client IP.
- Apply the backend migrations before starting the production release. See the
  [Hostinger deployment guide](../DEPLOY_HOSTINGER.md) for environment variables
  and the reverse proxy setup.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
