import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { hashSync } from 'bcryptjs';
import request from 'supertest';
import { App } from 'supertest/types';
import { AbsencesController } from '../src/absences/absences.controller';
import { AbsencesService } from '../src/absences/absences.service';
import { AuthModule } from '../src/auth/auth.module';
import { BookingsController } from '../src/bookings/bookings.controller';
import { BookingsRepository } from '../src/bookings/bookings.repository';
import { BookingsService } from '../src/bookings/bookings.service';
import { PatientsRepository } from '../src/bookings/patients.repository';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { DoctorsController } from '../src/doctors/doctors.controller';
import { DoctorsService } from '../src/doctors/doctors.service';
import { EventLogService } from '../src/logging/event-log.service';
import { EmployeesController } from '../src/employees/employees.controller';
import { EmployeesService } from '../src/employees/employees.service';
import { RolesController } from '../src/roles/roles.controller';
import { RolesModule } from '../src/roles/roles.module';
import { RolesService } from '../src/roles/roles.service';
import { ServicesController } from '../src/services/services.controller';
import { ServicesService } from '../src/services/services.service';
import { TransactionsController } from '../src/transactions/transactions.controller';
import { TransactionsService } from '../src/transactions/transactions.service';
import { UsersController } from '../src/users/users.controller';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { WebhooksService } from '../src/webhooks/webhooks.service';

const patient = { id: '42167de4-8d4b-46a8-86b4-8853104956b0', fullName: 'Existing Patient' };
const serviceId = 'a2e0d583-fbb1-4a99-8423-1f5811431234';
const catalogService = { id: serviceId, enabled: 1, deleted: 0, durationMinutes: 30 };
const booking = {
  id: '59763411-af3c-4e4a-aaac-f5ef3013d71a',
  bookingCode: 'BKG-100001',
  statusCode: 'PENDING',
  patient,
};
const dashboardAppointment = { id: booking.id, patient: patient.fullName };
const staff = {
  id: '8d5fe56b-c09d-4dfb-a4d5-2739442c56e5',
  email: 'staff@example.test',
  name: 'Clinic Staff',
  password: hashSync('staff-password', 4),
  enabled: 1,
  deleted: 0,
  sessionVersion: 0,
  roleCode: 'STAFF',
};
const role = {
  code: 'STAFF',
  enabled: 1,
  deleted: 0,
  permissions: {} as Record<string, boolean>,
};
const users = {
  findByEmailWithPassword: () => staff,
  findForSession: (id: string) => (id === staff.id ? staff : null),
  update: jest.fn(),
};
const roles = {
  findByCode: (code: string) => (code === role.code ? role : null),
  update: jest.fn(() => role),
};

@Module({
  controllers: [UsersController],
  providers: [{ provide: UsersService, useValue: users }],
  exports: [UsersService],
})
class TestUsersModule {}

@Module({
  controllers: [RolesController],
  providers: [{ provide: RolesService, useValue: roles }],
  exports: [RolesService],
})
class TestRolesModule {}

@Controller('unmarked')
class UnmarkedController {
  @Get()
  get() {
    return { allowed: true };
  }
}

describe('Booking API access', () => {
  let app: INestApplication<App>;
  let authHeader: string;
  const bookings = {
    findAll: jest.fn(() => [booking]),
    findById: jest.fn(() => booking),
    occupiedOn: jest.fn(() => []),
    createAndSave: jest.fn(() => booking),
    save: jest.fn((updatedBooking: typeof booking) => updatedBooking),
  };
  const patients = { findAll: () => [patient], findByPhone: () => patient };
  const employees = { create: jest.fn() };
  const transactions = { findAll: () => [], checkoutBooking: jest.fn(() => ({})) };
  const attendance = {
    clockIn: jest.fn((userId: string) => ({ userId })),
    getUserHistory: jest.fn(() => []),
    getAllAbsences: jest.fn(() => []),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
      ],
      controllers: [
        AbsencesController,
        BookingsController,
        DashboardController,
        DoctorsController,
        EmployeesController,
        ServicesController,
        TransactionsController,
        UnmarkedController,
      ],
      providers: [
        { provide: AbsencesService, useValue: attendance },
        BookingsService,
        { provide: BookingsRepository, useValue: bookings },
        { provide: PatientsRepository, useValue: patients },
        {
          provide: DashboardService,
          useValue: {
            getStats: () => ({ year: { balance: 500 }, upcomingAppointments: [dashboardAppointment] }),
            getAppointments: () => [dashboardAppointment],
          },
        },
        {
          provide: DoctorsService,
          useValue: {
            findAll: () => [
              {
                id: 'doctor',
                status: 'Active',
                days: [
                  'Sunday',
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                ],
                shiftStart: '10:00',
                shiftEnd: '11:00',
              },
            ],
            create: jest.fn(() => ({ id: 'new-doctor' })),
          },
        },
        { provide: EmployeesService, useValue: employees },
        {
          provide: ServicesService,
          useValue: {
            findAll: () => [catalogService],
            findById: () => catalogService,
            create: jest.fn(() => ({ id: 'new-service' })),
          },
        },
        { provide: TransactionsService, useValue: transactions },
        {
          provide: WebhooksService,
          useValue: { triggerWebhook: jest.fn().mockResolvedValue(true) },
        },
      ],
    })
      .overrideModule(UsersModule)
      .useModule(TestUsersModule)
      .overrideModule(RolesModule)
      .useModule(TestRolesModule)
      .overrideProvider(EventLogService)
      .useValue({ record: jest.fn() })
      .compile();

    app = module.createNestApplication();
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: staff.email, password: 'staff-password' })
      .expect(200);
    authHeader = `Bearer ${response.body.access_token}`;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    booking.statusCode = 'PENDING';
    staff.roleCode = 'STAFF';
    role.code = 'STAFF';
    role.enabled = 1;
    role.permissions = {};
  });

  afterAll(async () => {
    await app?.close();
  });

  it('keeps the service catalog, slots, and booking submission public', async () => {
    const api = request(app.getHttpServer());
    const date = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    await api.get('/services').expect(200, [{ id: serviceId, durationMinutes: 30 }]);
    const slots = await api
      .get('/bookings/available-slots')
      .query({ date, serviceId })
      .expect(200);
    expect(slots.body).toContain('10:00');
    await api
      .post('/bookings')
      .send({
        name: 'New Patient',
        phone: '08123456789',
        serviceId,
        date,
        time: '10:00',
      })
      .expect(201, { bookingCode: booking.bookingCode, statusCode: 'PENDING' });
    expect(bookings.createAndSave).toHaveBeenCalledTimes(1);
  });

  it.each([
    '/bookings',
    '/bookings/' + booking.id,
    '/bookings/patients',
    '/dashboard/stats',
    '/transactions',
  ])('protects %s', async (path) => {
    const api = request(app.getHttpServer());
    await api.get(path).expect(401);
    await api.get(path).set('Authorization', authHeader).expect(403);
  });

  it('denies routes without an explicit access rule', async () => {
    const api = request(app.getHttpServer());
    await api.get('/unmarked').expect(403);
    await api.get('/unmarked').set('Authorization', authHeader).expect(403);
  });

  it('accepts only valid, unexpired login tokens on staff routes', async () => {
    const api = request(app.getHttpServer());
    const jwt = app.get(JwtService);
    const expired = jwt.sign({ sub: staff.id, sv: 0 }, { expiresIn: -60 });
    const unknown = jwt.sign({ sub: 'f0ee6c15-9f23-4d05-a8dc-aac771f49073', sv: 0 });
    for (const token of ['invalid', expired, unknown]) {
      await api
        .get('/bookings')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    }
    expect(bookings.findAll).not.toHaveBeenCalled();
  });

  it('reads current menu permissions even when the token has older permissions', async () => {
    const api = request(app.getHttpServer());
    const session = () => api.get('/auth/session').set('Authorization', authHeader);
    await api.get('/auth/session').expect(401);
    role.permissions = { page_absence: true };
    await session().expect(200, {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: 'STAFF',
      permissions: { page_absence: true },
    });
    role.permissions.page_absence = false;
    const response = await session().expect(200);
    expect(response.body.permissions.page_absence).toBe(false);
    role.enabled = 0;
    await session().expect(403);
  });

  it('authorizes the existing scheduling and transaction workflows using current permissions', async () => {
    const api = request(app.getHttpServer());
    role.permissions = { page_schedules: true };
    await api
      .get('/bookings')
      .set('Authorization', authHeader)
      .expect(200, [booking]);
    await api
      .get('/bookings/' + booking.id)
      .set('Authorization', authHeader)
      .expect(200, booking);
    await api
      .get('/bookings/patients')
      .set('Authorization', authHeader)
      .expect(403);

    role.permissions = { page_transactions: true };
    await api
      .get('/bookings/patients')
      .set('Authorization', authHeader)
      .expect(200, [patient]);
    expect(bookings.findById).toHaveBeenCalledTimes(1);
    await api.get('/bookings').set('Authorization', authHeader).expect(403);

    role.enabled = 0;
    await api
      .get('/bookings/patients')
      .set('Authorization', authHeader)
      .expect(403);
  });

  it('requires both appointment access and status permission before updating', async () => {
    const update = () =>
      request(app.getHttpServer())
        .patch('/bookings/' + booking.id + '/status')
        .send({ status: 'CONFIRMED' });
    await update().expect(401);
    role.permissions = { feat_bookings_status: true };
    await update().set('Authorization', authHeader).expect(403);
    role.permissions = { page_bookings: true };
    await update().set('Authorization', authHeader).expect(403);
    expect(bookings.save).not.toHaveBeenCalled();

    role.permissions.feat_bookings_status = true;
    const updated = await update().set('Authorization', authHeader).expect(200);
    expect(updated.body.statusCode).toBe('CONFIRMED');
    expect(bookings.save).toHaveBeenCalledTimes(1);
  });

  it('guards staff booking creation separately from public booking', async () => {
    const api = request(app.getHttpServer());
    const create = () => api.post('/bookings/staff').send({
      name: 'New Patient',
      phone: '08123456789',
      serviceId,
      date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
      time: '10:00',
    });
    await create().expect(401);
    role.permissions = { page_bookings: true };
    await create().set('Authorization', authHeader).expect(403);
    role.permissions.feat_bookings_create = true;
    await create().set('Authorization', authHeader).expect(201);
  });

  it('authorizes schedule cancellation without granting booking management', async () => {
    const api = request(app.getHttpServer());
    const cancel = () => api.patch('/bookings/' + booking.id + '/cancel').set('Authorization', authHeader);
    role.permissions = { page_schedules: true, feat_bookings_status: true };
    await cancel().expect(403);
    role.permissions = { page_schedules: true, feat_schedules_cancel: true };
    const result = await cancel().expect(200);
    expect(result.body.statusCode).toBe('CANCELLED');
    await api.patch('/bookings/' + booking.id + '/status').set('Authorization', authHeader)
      .send({ status: 'CONFIRMED' }).expect(403);
  });

  it('returns only dashboard widgets granted to the role', async () => {
    const dashboard = () => request(app.getHttpServer()).get('/dashboard/stats')
      .set('Authorization', authHeader);
    role.permissions = { page_dashboard: true };
    await dashboard().expect(200, {});
    role.permissions.feat_dashboard_metrics = true;
    await dashboard().expect(200, { year: { balance: 500 } });
    role.permissions = { page_dashboard: true, feat_dashboard_appointments: true };
    await dashboard().expect(200, { upcomingAppointments: [dashboardAppointment] });
  });

  it('enforces catalog management and notification permissions', async () => {
    const api = request(app.getHttpServer());
    const authed = (call: request.Test) => call.set('Authorization', authHeader);
    await api.get('/services').expect(200, [{ id: serviceId, durationMinutes: 30 }]);
    await authed(api.get('/services/staff')).expect(403);
    await authed(api.get('/auth/notification-access')).expect(403);
    role.permissions = { page_services: true, page_doctors: true, feat_notifications_view: true };
    await authed(api.get('/services/staff')).expect(200);
    await authed(api.get('/auth/notification-access')).expect(200);
    await authed(api.post('/services')).expect(403);
    await authed(api.post('/doctors')).expect(403);
    role.permissions.feat_services_write = true;
    role.permissions.feat_doctors_write = true;
    await authed(api.post('/services').send({ name: 'Service' })).expect(201);
    await authed(api.post('/doctors').send({ name: 'Doctor', specialty: 'General', email: 'doctor@example.test' })).expect(201);
  });

  it('binds self-attendance to the authenticated staff member', async () => {
    const api = request(app.getHttpServer());
    const authed = (call: request.Test) => call.set('Authorization', authHeader);
    role.permissions = { page_absence: true, feat_absence_history: true };
    await authed(api.get('/absences')).expect(403);
    await authed(api.get('/absences/history/another-user')).expect(403);
    await authed(api.get(`/absences/history/${staff.id}`)).expect(200, []);
    await authed(api.post('/absences/clock-in')).expect(403);
    role.permissions.feat_absence_clock_in = true;
    await authed(api.post('/absences/clock-in').send({ userId: 'another-user', location: 'Clinic' }))
      .expect(201, { userId: staff.id });
    expect(attendance.clockIn).toHaveBeenCalledWith(staff.id, 'Clinic');
  });

  it('requires invoice creation permission for booking checkout', async () => {
    const checkout = () =>
      request(app.getHttpServer())
        .post('/transactions/booking-checkout/' + booking.id)
        .set('Authorization', authHeader)
        .send({ items: [{ name: 'Examination', price: 10000, quantity: 1 }] });
    role.permissions = { page_bookings: true, feat_bookings_status: true };
    await checkout().expect(403);
    expect(transactions.checkoutBooking).not.toHaveBeenCalled();

    role.permissions.feat_transactions_create = true;
    await checkout().expect(201);
  });

  it('restricts account and role writes to administrators', async () => {
    const api = request(app.getHttpServer());
    role.permissions = {
      page_employees: true,
      feat_employees_write: true,
      page_roles: true,
      feat_roles_write: true,
    };
    for (const write of [
      () => api.put('/users/staff-id'),
      () => api.post('/employees'),
      () => api.put('/roles/STAFF'),
    ]) {
      await write().expect(401);
      await write().set('Authorization', authHeader).expect(403);
    }
    expect(users.update).not.toHaveBeenCalled();
    expect(employees.create).not.toHaveBeenCalled();
    expect(roles.update).not.toHaveBeenCalled();

    staff.roleCode = 'ADMIN';
    role.code = 'ADMIN';
    await api
      .put('/roles/STAFF')
      .set('Authorization', authHeader)
      .send({})
      .expect(200);
    expect(roles.update).toHaveBeenCalledTimes(1);
  });
});
