import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { z } from 'zod';
import { RequireStaff, type StaffRequest } from '../auth/staff-access.guard';
import { emailField, parseInput, textField } from '../input';

const settingsInput = z.object({
  clinicName: textField(500),
  clinicPhone: textField(30),
  clinicEmail: emailField,
  clinicAddress: textField(500),
});

@Controller('settings')
@RequireStaff(['page_settings'])
export class SettingsController {
  constructor(private readonly database: DataSource) {}

  @Get()
  async load() {
    const [row] = await this.database.query<{ setting_value: string }[]>(`
      SELECT setting_value FROM public.app_settings
      WHERE clinic_id IS NULL AND setting_code = 'PORTAL_CONFIG' AND enabled = 1 AND deleted = 0
    `);
    return row ? JSON.parse(row.setting_value) : {};
  }

  @Put()
  @RequireStaff(['page_settings', 'feat_settings_write'])
  async save(@Body() input: unknown, @Req() request: StaffRequest) {
    const settings = parseInput(settingsInput, input);
    await this.database.query(`
      INSERT INTO public.app_settings (setting_code, setting_value, created_by, updated_by)
      VALUES ('PORTAL_CONFIG', $1, $2, $2)
      ON CONFLICT (setting_code) WHERE clinic_id IS NULL AND setting_code = 'PORTAL_CONFIG'
      DO UPDATE SET setting_value = (app_settings.setting_value::jsonb || EXCLUDED.setting_value::jsonb)::text,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW(), enabled = 1, deleted = 0
    `, [JSON.stringify(settings), request.staff.id]);
    return settings;
  }
}
