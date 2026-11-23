import { Injectable, BadRequestException } from '@nestjs/common';
import { AbsencesRepository } from './absences.repository';
import { Absence } from './absence.entity';
import { localDate } from '../local-date';

@Injectable()
export class AbsencesService {
  constructor(private readonly absencesRepository: AbsencesRepository) {}

  async getTodayAbsence(userId: string): Promise<Absence | null> {
    const todayStr = localDate();
    return this.absencesRepository.findTodayAbsence(userId, todayStr);
  }

  async getUserHistory(userId: string): Promise<Absence[]> {
    return this.absencesRepository.findUserHistory(userId);
  }

  async clockIn(userId: string, location: string): Promise<Absence> {
    const todayStr = localDate();
    const existing = await this.absencesRepository.findTodayAbsence(userId, todayStr);

    if (existing) {
      throw new BadRequestException('Already clocked in today.');
    }

    const now = new Date();
    
    // Set limit to today at 8:20 AM
    const limit = new Date(now);
    limit.setHours(8, 20, 0, 0);

    const status = now.getTime() > limit.getTime() ? 'LATE' : 'PRESENT';

    return this.absencesRepository.save({
      userId,
      date: todayStr,
      clockIn: now,
      clockInLocation: location,
      status,
    });
  }

  async clockOut(userId: string, location: string): Promise<Absence> {
    const todayStr = localDate();
    const existing = await this.absencesRepository.findTodayAbsence(userId, todayStr);

    if (!existing) {
      throw new BadRequestException('You must clock in first.');
    }

    if (existing.clockOut) {
      throw new BadRequestException('Already clocked out today.');
    }

    existing.clockOut = new Date();
    existing.clockOutLocation = location;

    return this.absencesRepository.save(existing);
  }

  async getAllAbsences(): Promise<Absence[]> {
    return this.absencesRepository.findAllWithUsers();
  }
}
