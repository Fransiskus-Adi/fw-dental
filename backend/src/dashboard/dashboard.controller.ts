import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { RequireStaff } from '../auth/staff-access.guard';
import type { StaffRequest } from '../auth/staff-access.guard';

@Controller('dashboard')
@RequireStaff(['page_dashboard'])
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Req() request: StaffRequest) {
    const permissions = request.staff.permissions;
    const showMetrics = permissions.feat_dashboard_metrics === true;
    const showAppointments = permissions.feat_dashboard_appointments === true;
    if (!showMetrics) {
      return showAppointments
        ? { upcomingAppointments: await this.dashboardService.getAppointments() }
        : {};
    }
    const { upcomingAppointments, ...metrics } = await this.dashboardService.getStats();
    return showAppointments ? { ...metrics, upcomingAppointments } : metrics;
  }
}
