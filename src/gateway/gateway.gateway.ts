import { JwtService } from "@nestjs/jwt";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { FriendsService } from "src/friends/friends.service";
import { PresenceService, PresenceStatus } from "src/presence/presence.service";

@WebSocketGateway({
    namespace: 'status',
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly friendsService: FriendsService,
        private readonly presenceService: PresenceService,
    ) { }

    async handleConnection(socket: Socket) {
        const userId = await this.extractUserId(socket);
        if (!userId) return;
        socket.data.userId = userId;

        const wasOffline = !this.presenceService.isOnline(userId);
        this.presenceService.setOnline(userId, socket.id);
        if (wasOffline) {
            await this.emitToFriends(userId, {
                type: "friend:status",
                body: { userId, status: PresenceStatus.Online }
            });
        }
    }

    async handleDisconnect(socket: Socket) {
        const userId: string = socket.data.userId;
        if (!userId) return;

        this.presenceService.setOffline(userId, socket.id);
        if (!this.presenceService.isOnline(userId)) {
            await this.emitToFriends(userId, {
                type: "friend:status",
                body: { userId, status: PresenceStatus.Offline }
            });
        }
    }

    async extractUserId(socket: Socket): Promise<string | null> {
        try {
            const token = socket.handshake.auth.token;
            const payload = await this.jwtService.verifyAsync<{ id: string }>(token);
            return payload.id;
        } catch {
            socket.disconnect();
            return null;
        }
    }

    async emitToFriends(userId: string, event: Event) {
        const friends = await this.friendsService.getFriends(userId);
        friends.forEach(friend => {
            this.emitMessageTo(friend.id, event);
        });
    }

    emitMessageTo(userId: string, event: Event) {
        const sockets = this.presenceService.getSockets(userId);
        sockets.forEach(socketId => {
            this.server.to(socketId).emit(event.type, event.body);
        });
    }
}

interface Event {
    type: string,
    body: unknown
}
