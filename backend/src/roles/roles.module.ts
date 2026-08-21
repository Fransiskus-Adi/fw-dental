import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { RolesRepository } from './roles.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RolesService, RolesRepository],
  controllers: [RolesController],
  exports: [RolesService, RolesRepository],
})
export class RolesModule {}
