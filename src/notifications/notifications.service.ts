import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Notification, { NotificationType } from './entities/Notification.entity';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import FriendRequestSentEvent from 'src/events/friend-request-sent.event';
import NotificationCreatedEvent from 'src/events/notification-created.event';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getNotifications(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.notificationsRepository.update({ id, userId }, { read: true });
  }

  @OnEvent('friend.request.sent')
  async onFriendRequestSent({ senderId, senderName, senderImage, recipientId }: FriendRequestSentEvent): Promise<void> {
    const notification = await this.notificationsRepository.save({
      userId: recipientId,
      type: NotificationType.FRIEND_REQUEST,
      title: 'Friend Request',
      message: `${senderName} wants to be your friend.`,
      image: senderImage,
    });

    this.eventEmitter.emit('notification.created', new NotificationCreatedEvent(notification, new Set([recipientId])));
  }
}
