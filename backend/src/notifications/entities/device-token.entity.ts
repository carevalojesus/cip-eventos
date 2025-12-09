import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export enum TokenProvider {
  FCM = 'FCM', // Firebase Cloud Messaging
  APNS = 'APNS', // Apple Push Notification Service
  WEB_PUSH = 'WEB_PUSH', // Web Push API
}

@Entity('device_tokens')
@Index(['user'])
@Index(['token'], { unique: true })
@Index(['platform'])
@Index(['isActive'])
export class DeviceToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  token: string;

  @Column({
    type: 'enum',
    enum: DevicePlatform,
    default: DevicePlatform.WEB,
  })
  platform: DevicePlatform;

  @Column({
    type: 'enum',
    enum: TokenProvider,
    default: TokenProvider.FCM,
  })
  provider: TokenProvider;

  @Column({ type: 'text', nullable: true })
  deviceName: string | null;

  @Column({ type: 'text', nullable: true })
  deviceModel: string | null;

  @Column({ type: 'text', nullable: true })
  osVersion: string | null;

  @Column({ type: 'text', nullable: true })
  appVersion: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
