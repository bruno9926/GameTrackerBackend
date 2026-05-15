export abstract class OutboundEvent {
    // list of user ids — the gateway resolves these to socket ids
    abstract readonly recipientIds: Set<string>;
}