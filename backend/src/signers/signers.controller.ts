import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SignersService } from './signers.service';
import { CreateSignerDto } from './dto/create-signer.dto';
import { UpdateSignerDto } from './dto/update-signer.dto';

@Controller('signers')
export class SignersController {
  constructor(private readonly signersService: SignersService) {}

  @Post()
  create(@Body() createSignerDto: CreateSignerDto) {
    return this.signersService.create(createSignerDto);
  }

  @Get()
  findAll() {
    return this.signersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.signersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSignerDto: UpdateSignerDto) {
    return this.signersService.update(id, updateSignerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.signersService.remove(id);
  }
}
