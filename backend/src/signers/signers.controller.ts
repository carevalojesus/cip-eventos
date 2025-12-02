import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SignersService } from './signers.service';
import { CreateSignerDto } from './dto/create-signer.dto';
import { UpdateSignerDto } from './dto/update-signer.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from 'src/auth/guards/email-verified.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('signers')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, RolesGuard)
export class SignersController {
  constructor(private readonly signersService: SignersService) {}

  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN')
  create(@Body() createSignerDto: CreateSignerDto) {
    return this.signersService.create(createSignerDto);
  }

  @Get()
  @Public()
  findAll() {
    return this.signersService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.signersService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  update(@Param('id') id: string, @Body() updateSignerDto: UpdateSignerDto) {
    return this.signersService.update(id, updateSignerDto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.signersService.remove(id);
  }
}
