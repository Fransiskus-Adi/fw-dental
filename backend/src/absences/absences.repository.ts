import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Absence } from './absence.entity';

@Injectable()
export class AbsencesRepository {
  constructor(
    @InjectRepository(Absence)
    private readonly repository: Repository<Absence>,
  ) {}

  async findTodayAbsence(userId: string, dateStr: string): Promise<Absence | null> {
    return this.repository.findOne({ where: { userId, date: dateStr } });
  }

  async findUserHistory(userId: string): Promise<Absence[]> {
    return this.repository.find({
      where: { userId },
      order: { date: 'DESC' },
    });
  }

  async findAllWithUsers(): Promise<Absence[]> {
    return this.repository.find({
      relations: {
        user: true,
      },
      order: { date: 'DESC', clockIn: 'DESC' },
    });
  }

  async save(absence: Partial<Absence>): Promise<Absence> {
    const entity = this.repository.create(absence);
    return this.repository.save(entity);
  }
}
