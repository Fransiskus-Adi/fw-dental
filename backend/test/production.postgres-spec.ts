import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { MailService } from '../src/mail/mail.service';
import { localDate } from '../src/local-date';
import { HttpLoggingFilter } from '../src/logging/http-logging';

jest.setTimeout(30_000);

const email = 'admin@example.test';
const original = 'first long test password';
const replacement = 'second long test password';
const database = 'fw_dental_test_' + randomBytes(8).toString('hex');
const host = process.env.DB_HOST || '127.0.0.1';
const connection = {
  host,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
};
const originalEnvironment = { ...process.env };
let admin: Client | undefined;
let client: Client | undefined;
let createdDatabase = false;
let app: INestApplication<App>;
let treatmentId: string;
let emailSent: string | undefined;
let currentPassword = original;

beforeAll(async () => {
  if (!['127.0.0.1', '::1', 'localhost'].includes(host)) {
    throw new Error('The test must use a local PostgreSQL instance and a scratch database.');
  }
  admin = new Client({ ...connection, database: 'postgres' });
  await admin.connect();
  await admin.query('CREATE DATABASE ' + database);
  createdDatabase = true;
  client = new Client({ ...connection, database });
  await client.connect();

  const migrations = join(__dirname, '../db/migration');
  const files = (await readdir(migrations))
    .filter(file => /^V\d+__.*\.sql$/.test(file))
    .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
  for (const file of files) await client.query(await readFile(join(migrations, file), 'utf8'));

  await client.query(`
    WITH account AS (
      INSERT INTO auth.users (email, full_name, password_hash)
      VALUES ($1, 'Integration Administrator', crypt($2, gen_salt('bf', 4))) RETURNING id
    )
    INSERT INTO auth.user_roles (user_id, role_code) SELECT id, 'ADMIN' FROM account
  `, [email, original]);
  const service = await client.query(`
    INSERT INTO public.services (name, code, duration_minutes)
    VALUES ('Examination', 'TEST-EXAM', 60) RETURNING id
  `);
  treatmentId = service.rows[0].id;
  await client.query(`
    INSERT INTO public.doctors (code, name, specialization, days, shift_start, shift_end)
    VALUES ('TEST-DENTIST', 'Test Dentist', 'General', 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday', '09:00', '17:00')
  `);

  Object.assign(process.env, {
    DB_DATABASE: database,
    DB_HOST: host,
    DB_SYNCHRONIZE: 'false',
    NODE_ENV: 'test',
    PUBLIC_APP_URL: 'https://clinic.example.test',
    NOTIFICATION_WEBHOOK_SECRET: '',
    SMTP_NOTIFICATION_TO: '',
  });
  const { AppModule } = jest.requireActual<typeof import('../src/app.module')>('../src/app.module');
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue({
      sendPasswordResetEmail: async (_email: string, link: string) => { emailSent = link; },
    })
    .compile();
  app = module.createNestApplication();
  app.useGlobalFilters(new HttpLoggingFilter(app.getHttpAdapter()));
  await app.init();
});

afterAll(async () => {
  try {
    await app?.close();
    await client?.end();
    if (createdDatabase) await admin!.query('DROP DATABASE ' + database);
  } finally {
    await admin?.end();
    for (const key of ['DB_DATABASE', 'DB_HOST', 'DB_SYNCHRONIZE', 'NODE_ENV', 'PUBLIC_APP_URL', 'NOTIFICATION_WEBHOOK_SECRET', 'SMTP_NOTIFICATION_TO']) {
      if (originalEnvironment[key] === undefined) delete process.env[key];
      else process.env[key] = originalEnvironment[key];
    }
  }
});

it('revokes the seeded development administrator without deleting the staff profile', async () => {
  const { rows } = await client!.query(`
    SELECT u.enabled, u.password_hash IS NULL AS revoked, e.id IS NOT NULL AS has_profile
    FROM auth.users u JOIN public.employees e ON e.id = u.id
    WHERE u.id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  `);
  expect(rows).toEqual([{ enabled: 0, revoked: true, has_profile: true }]);
});

it('allows exactly one reset and invalidates a previously issued session', async () => {
  const api = request(app.getHttpServer());
  const login = (password: string) => api.post('/auth/login').send({ email, password });
  const previous = await login(original).expect(200);
  const authorization = 'Bearer ' + previous.body.access_token;
  await api.get('/auth/session').set('Authorization', authorization).expect(200);
  const missing = await api.post('/auth/forgot-password').send({ email: 'missing@example.test' }).expect(202);
  const existing = await api.post('/auth/forgot-password').send({ email }).expect(202);
  expect(existing.body).toEqual(missing.body);

  for (let attempt = 0; !emailSent && attempt < 100; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  expect(emailSent).toBeDefined();
  const token = new URLSearchParams(new URL(emailSent!).hash.slice(1)).get('reset');
  const reset = () => api.post('/auth/reset-password').send({ token, password: replacement });
  const results = await Promise.all([reset(), reset()]);
  expect(results.map(result => result.status).sort()).toEqual([200, 400]);
  await api.get('/auth/session').set('Authorization', authorization).expect(401);
  await login(original).expect(401);
  await login(replacement).expect(200);
  currentPassword = replacement;
});

it('commits only one of two overlapping bookings and leaves the loser without a patient row', async () => {
  const api = request(app.getHttpServer());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = localDate(tomorrow);
  const input = { name: 'Test Patient', serviceId: treatmentId, date };
  const results = await Promise.all([
    api.post('/bookings').send({ ...input, phone: '08123456701', time: '10:00' }),
    api.post('/bookings').send({ ...input, phone: '08123456702', time: '10:30' }),
  ]);
  expect(results.map(result => result.status).sort()).toEqual([201, 409]);
  const { rows: patients } = await client!.query('SELECT count(*)::int AS count FROM public.patients');
  expect(patients[0].count).toBe(1);
  const { body: slots } = await api.get('/bookings/available-slots').query({ date, serviceId: treatmentId }).expect(200);
  expect(slots).not.toContain('10:00');
  expect(slots).not.toContain('10:30');
  expect(slots).toContain('11:30');

  const login = await api.post('/auth/login').send({ email, password: currentPassword }).expect(200);
  const authorization = 'Bearer ' + login.body.access_token;
  const { rows: [booking] } = await client!.query('SELECT id FROM public.bookings');
  await api.patch('/bookings/' + booking.id + '/status').set('Authorization', authorization)
    .send({ status: 'CONFIRMED' }).expect(200);
  const checkout = () => api.post('/transactions/booking-checkout/' + booking.id)
    .set('Authorization', authorization)
    .send({ items: [{ name: 'Examination', serviceId: treatmentId, price: 10000, quantity: 1 }] });
  const invoice = await checkout().expect(201);
  const retried = await checkout().expect(201);
  expect(retried.body.id).toBe(invoice.body.id);
});
