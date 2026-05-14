import { JwtService } from "@nestjs/jwt";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { FriendsService } from "src/friends/friends.service";
import { UserStatus } from "src/users/entities/User.entity";
import { UsersService } from "src/users/users.service";

@WebSocketGateway({
    namespace: 'status',
    cors: {
        origin: 'http://localhost:5173', // El origen de tu frontend (Vite/React)
        methods: ['GET', 'POST'],
        credentials: true,
    },
})
export class StatusGateway implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly friendsService: FriendsService,
        private readonly usersService: UsersService
    ) { }

    // store the sessions open for each user
    private connectionMap: Record<string, Set<string>> = {};

    async handleConnection(socket: Socket) {
        const userId = await this.extractUserId(socket);
        socket.data.userId = userId;

        let connectionSet = this.connectionMap[userId];
        if (!connectionSet) {
            connectionSet = new Set<string>();
            this.connectionMap[userId] = connectionSet;
        }
        if (connectionSet.size === 0) {
            // first connection, persist status and notify friends
            await this.usersService.setStatus(userId, UserStatus.online);
            await this.emitToFriends(userId, {
                type: "friend:status",
                body: { userId, status: UserStatus.online }
            })
        }
        connectionSet.add(socket.id);
    }

    async handleDisconnect(socket: Socket) {
        const userId: string = socket.data.userId;
        if (!userId) return;

        let connectionSet = this.connectionMap[userId];
        if (!connectionSet) {
            // not previous connections
            return;
        }
        connectionSet.delete(socket.id);
        
        if (connectionSet.size === 0) {
            // no sessions left, persist status and notify friends
            await this.usersService.setStatus(userId, UserStatus.offline);
            await this.emitToFriends(userId, {
                type: "friend:status",
                body: { userId, status: UserStatus.offline }
            })
        }
    }

    async extractUserId(socket: Socket) {
        try {
            const token = socket.handshake.auth.token;
            const payload = await this.jwtService.verifyAsync<{ id: string }>(token);
            return payload.id;
        } catch (e) {
            socket.disconnect();
            throw e;
        }
    }

    async emitToFriends(userId: string, event: Event) {
        const friends = await this.friendsService.getFriends(userId);
        friends.forEach(friend => {
            this.emitMessageTo(friend.id, event)
        })
    }

    emitMessageTo(userId: string, event: Event) {
        const connections = this.connectionMap[userId];
        if (!connections) {
            // no open connections for recipient
            return;
        }
        connections.forEach(c => {
            this.server.to(c).emit(event.type, event.body)
        })
    }
}

interface Event {
    type: string,
    body: unknown
}