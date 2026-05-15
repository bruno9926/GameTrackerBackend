export default class ClientDisconnectedEvent {
    constructor(
        public readonly userId: string,
        public readonly socketId: string
    ) {}
}