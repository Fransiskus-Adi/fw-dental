import { Controller, Get, Post, Body, Param, Req, ForbiddenException } from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { Absence } from './absence.entity';
import { RequireStaff } from '../auth/staff-access.guard';
import type { StaffRequest } from '../auth/staff-access.guard';
import { parseInput, textField } from '../input';

@Controller('absences')
@RequireStaff(['page_absence'])
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Get()
  @RequireStaff(['page_absence', 'feat_absence_employee_logs'])
  getAllAbsences(): Promise<Absence[]> {
    return this.absencesService.getAllAbsences();
  }

  @Get('today/:userId')
  getTodayAbsence(@Param('userId') userId: string, @Req() request: StaffRequest): Promise<Absence | null> {
    if (userId !== request.staff.id) throw new ForbiddenException();
    return this.absencesService.getTodayAbsence(userId);
  }

  @Get('history/:userId')
  @RequireStaff(['page_absence', 'feat_absence_history'])
  getUserHistory(@Param('userId') userId: string, @Req() request: StaffRequest): Promise<Absence[]> {
    if (userId !== request.staff.id) throw new ForbiddenException();
    return this.absencesService.getUserHistory(userId);
  }

  @Post('clock-in')
  @RequireStaff(['page_absence', 'feat_absence_clock_in'])
  clockIn(
    @Req() request: StaffRequest,
    @Body('location') location: unknown,
  ): Promise<Absence> {
    return this.absencesService.clockIn(request.staff.id, parseInput(textField(255), location));
  }

  @Post('clock-out')
  @RequireStaff(['page_absence', 'feat_absence_clock_out'])
  clockOut(
    @Req() request: StaffRequest,
    @Body('location') location: unknown,
  ): Promise<Absence> {
    return this.absencesService.clockOut(request.staff.id, parseInput(textField(255), location));
  }
}
