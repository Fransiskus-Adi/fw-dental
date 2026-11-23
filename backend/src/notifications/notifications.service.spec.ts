import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EventLogService } from '../logging/event-log.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from './notifications.service';

jest.mock('nodemailer');

describe('NotificationsService', () => {
  const sendMail = jest.fn();
  const record = jest.fn();
  const webhookSecret = 'example-notification-webhook-secret';

  function setup(recipient = '', secret = webhookSecret) {
    const config = new ConfigService({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '465',
      SMTP_USER: 'sender@example.com',
      SMTP_PASS: 'test-password',
      SMTP_FROM: 'FW Dental <sender@example.com>',
      SMTP_NOTIFICATION_TO: recipient,
      NOTIFICATION_WEBHOOK_SECRET: secret,
      WEBHOOK_URL: 'http://localhost:3000/api/webhooks/notifications',
    });
    const events = { record } as unknown as EventLogService;
    const mail = new MailService(config, events);
    const notifications = new NotificationsService(config, events, mail);
    const webhook = jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));
    return { mail, notifications, webhook };
  }

  beforeEach(() => {
    jest.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as unknown as nodemailer.Transporter);
    sendMail.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('uses one env-configured SMTP transport for resets and notifications', async () => {
    const { mail, notifications, webhook } = setup('staff@example.com');

    await mail.sendPasswordResetEmail('account@example.com', 'https://example.com/admin/login#reset=token');
    await notifications.publish('BOOKING_CREATED');

    expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'sender@example.com', pass: 'test-password' },
    }));
    expect(sendMail).toHaveBeenNthCalledWith(1, expect.objectContaining({
      from: 'FW Dental <sender@example.com>',
      to: 'account@example.com',
      text: expect.stringContaining('#reset=token'),
    }));
    expect(sendMail).toHaveBeenNthCalledWith(2, expect.objectContaining({
      from: 'FW Dental <sender@example.com>',
      to: 'staff@example.com',
      subject: 'New clinic booking',
    }));
    expect(webhook).toHaveBeenCalledWith(
      'http://localhost:3000/api/webhooks/notifications',
      expect.objectContaining({ body: JSON.stringify({ event: 'BOOKING_CREATED' }) }),
    );
  });

  it('keeps dashboard notifications active with an empty SMTP recipient', async () => {
    const { notifications, webhook } = setup();
    await notifications.publish('CLOCK_IN_REMINDER');
    expect(sendMail).not.toHaveBeenCalled();
    expect(webhook).toHaveBeenCalledTimes(1);
  });

  it('logs SMTP failure without interrupting dashboard delivery', async () => {
    sendMail.mockRejectedValueOnce(new Error('SMTP unavailable'));
    const { notifications, webhook } = setup('staff@example.com');
    await notifications.publish('CLOCK_OUT_REMINDER');
    expect(webhook).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ event: 'mail.delivery_failed' }));
  });

  it('sends email when the dashboard webhook is disabled', async () => {
    const { notifications, webhook } = setup('staff@example.com', '');
    await notifications.publish('CLOCK_IN_REMINDER');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'staff@example.com' }));
    expect(webhook).not.toHaveBeenCalled();
  });
});
