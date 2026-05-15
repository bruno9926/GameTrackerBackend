export default class ClientConnectedEvent {
    constructor(
        public readonly userId: string,
        public readonly socketId: string
    ) {}
}