import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Doctor } from './doctor.entity';
import { DoctorsRepository } from './doctors.repository';
import { UsersService } from '../users/users.service';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly doctorsRepository: DoctorsRepository,
    private readonly usersService: UsersService,
  ) {}

  async findAll(): Promise<Doctor[]> {
    return this.doctorsRepository.findAllOrderedByCreatedAtDesc();
  }

  async findById(id: string): Promise<Doctor | null> {
    return this.doctorsRepository.findById(id);
  }

  async create(doctorData: Partial<Doctor>): Promise<Doctor> {
    if (doctorData.email) {
      const existing = await this.doctorsRepository.findByEmail(
        doctorData.email,
      );
      if (existing) {
        throw new ConflictException('Doctor with this email already exists');
      }

      const existingUser = await this.usersService.findByEmail(
        doctorData.email,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (!doctorData.code) {
      doctorData.code = `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // First create corresponding user in users table
    const name = doctorData.name || '';
    const email = doctorData.email || '';
    const phone = doctorData.phone;
    const user = await this.usersService.create(name, email, 'password', phone);

    // Save doctor using the same ID
    doctorData.id = user.id;
    return this.doctorsRepository.createAndSave(doctorData);
  }

  async update(id: string, doctorData: Partial<Doctor>): Promise<Doctor> {
    const doctor = await this.doctorsRepository.findById(id);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctorData.email && doctorData.email !== doctor.email) {
      const existing = await this.doctorsRepository.findByEmail(
        doctorData.email,
      );
      if (existing) {
        throw new ConflictException('Doctor with this email already exists');
      }

      const existingUser = await this.usersService.findByEmail(
        doctorData.email,
      );
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user record first
    const user = await this.usersService.findById(id);
    const updatedName =
      doctorData.name !== undefined ? doctorData.name : doctor.name;
    const updatedEmail =
      doctorData.email !== undefined ? doctorData.email : doctor.email;
    const updatedPhone =
      doctorData.phone !== undefined ? doctorData.phone : doctor.phone;

    if (user) {
      await this.usersService.update(
        id,
        updatedName,
        updatedEmail || '',
        undefined,
        updatedPhone,
      );
    } else if (updatedEmail) {
      // If user record doesn't exist, create it with same ID
      await this.usersService.create(
        updatedName,
        updatedEmail,
        'password',
        updatedPhone,
      );
    }

    // Then update doctor
    Object.assign(doctor, doctorData);
    return this.doctorsRepository.createAndSave(doctor);
  }

  async delete(id: string): Promise<void> {
    // Delete doctor first
    await this.doctorsRepository.deleteById(id);

    // Delete user
    await this.usersService.delete(id);
  }
}
