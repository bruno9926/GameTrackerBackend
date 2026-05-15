import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { JwtService } from "@nestjs/jwt";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import ClientConnectedEvent from "src/events/client-connected.event";
import ClientDisconnectedEvent from "src/events/client-disconnected.event";
import FriendStatusChanged from "src/events/friend-status-changed.event";
import NotificationCreatedEvent from "src/events/notification-created.event";
import { ConnectionRegistryService } from "src/connection-registry/connection-registry.service";

@WebSocketGateway({
    namespace: 'status',
    cors: {
        origin: (_, callback) => callback(null, process.env.FRONTEND_URL),
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly eventEmitter: EventEmitter2,
        private readonly connectionRegistry: ConnectionRegistryService,
    ) { }

    async handleConnection(socket: Socket) {
        const userId = await this.extractUserId(socket);
        if (!userId) return;
        socket.data.userId = userId;

        this.eventEmitter.emit(
            'client.connected',
            new ClientConnectedEvent(userId, socket.id)
        )
    }

    async handleDisconnect(socket: Socket) {
        const userId: string = socket.data.userId;
        if (!userId) return;

        this.eventEmitter.emit(
            'client.disconnected',
            new ClientDisconnectedEvent(userId, socket.id)
        )
    }

    // Send out port
    @OnEvent("friend.status.changed")
    onFriendStatusChanged({ userId, status, recipientIds }: FriendStatusChanged) {
        this.resolveSocketIds(recipientIds).forEach(socketId => {
            this.server.to(socketId).emit("friend:status", { userId, status });
        });
    }

    @OnEvent('notification.created')
    onNotificationCreated({ notification, recipientIds }: NotificationCreatedEvent) {
        this.resolveSocketIds(recipientIds).forEach(socketId => {
            this.server.to(socketId).emit('notification:created', notification);
        });
    }

    private resolveSocketIds(userIds: Set<string>): Set<string> {
        const socketIds = new Set<string>();
        userIds.forEach(userId => {
            this.connectionRegistry.getSockets(userId).forEach(socketId => socketIds.add(socketId));
        });
        return socketIds;
    }

    private async extractUserId(socket: Socket): Promise<string | null> {
        try {
            const token = socket.handshake.auth.token;
            const payload = await this.jwtService.verifyAsync<{ id: string }>(token);
            return payload.id;
        } catch {
            socket.disconnect();
            return null;
        }
    }
}
