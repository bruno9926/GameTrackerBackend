import Notification from "src/notifications/entities/Notification.entity";
import { OutboundEvent } from "./outbound.event";

export default class NotificationCreatedEvent extends OutboundEvent {
    constructor(
        public readonly notification: Notification,
        public readonly recipientIds: Set<string>,
    ) {
        super();
    }
}
