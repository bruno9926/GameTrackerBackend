import { PresenceStatus } from "src/connection-registry/connection-registry.service";
import { OutboundEvent } from "./outbound.event";

export default class FriendStatusChanged extends OutboundEvent {
    constructor(
        public readonly userId: string,
        public readonly status: PresenceStatus,
        public readonly recipientIds: Set<string>
    ) {
        super();
    }
}