import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class JoinWaitlistDto {
  @IsUUID()
  @IsNotEmpty()
  ticketId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  personId: string;
}
