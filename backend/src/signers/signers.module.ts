import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignersService } from './signers.service';
import { SignersController } from './signers.controller';
import { Signer } from './entities/signer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Signer])],
  controllers: [SignersController],
  providers: [SignersService],
})
export class SignersModule {}
