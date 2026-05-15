export default class FriendRequestSentEvent {
    constructor(
        public readonly senderId: string,
        public readonly senderName: string,
        public readonly senderImage: string | null,
        public readonly recipientId: string,
    ) {}
}
