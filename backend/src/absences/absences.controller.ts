import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AbsencesService } from './absences.service';
import { Absence } from './absence.entity';

@Controller('absences')
export class AbsencesController {
  constructor(private readonly absencesService: AbsencesService) {}

  @Get()
  getAllAbsences(): Promise<Absence[]> {
    return this.absencesService.getAllAbsences();
  }

  @Get('today/:userId')
  getTodayAbsence(@Param('userId') userId: string): Promise<Absence | null> {
    return this.absencesService.getTodayAbsence(userId);
  }

  @Get('history/:userId')
  getUserHistory(@Param('userId') userId: string): Promise<Absence[]> {
    return this.absencesService.getUserHistory(userId);
  }

  @Post('clock-in')
  clockIn(
    @Body() body: { userId: string; location: string },
  ): Promise<Absence> {
    return this.absencesService.clockIn(body.userId, body.location);
  }

  @Post('clock-out')
  clockOut(
    @Body() body: { userId: string; location: string },
  ): Promise<Absence> {
    return this.absencesService.clockOut(body.userId, body.location);
  }
}
