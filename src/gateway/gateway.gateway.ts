import { JwtService } from "@nestjs/jwt";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';
import { PresenceService } from "src/presence/presence.service";

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
        private readonly presenceService: PresenceService,
    ) { }

    async handleConnection(socket: Socket) {
        const userId = await this.extractUserId(socket);
        if (!userId) return;
        socket.data.userId = userId;
        await this.presenceService.handleConnect(this.server, userId, socket.id);
    }

    async handleDisconnect(socket: Socket) {
        const userId: string = socket.data.userId;
        if (!userId) return;
        await this.presenceService.handleDisconnect(this.server, userId, socket.id);
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
