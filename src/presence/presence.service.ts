import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { ConnectionRegistryService, PresenceStatus } from "src/connection-registry/connection-registry.service";
import { FriendsService } from "src/friends/friends.service";

@Injectable()
export class PresenceService {

    constructor(
        private readonly connectionRegistry: ConnectionRegistryService,
        private readonly friendsService: FriendsService,
    ) { }

    async handleConnect(server: Server, userId: string, socketId: string): Promise<void> {
        const wasOffline = !this.connectionRegistry.isOnline(userId);
        this.connectionRegistry.setOnline(userId, socketId);
        if (wasOffline) {
            await this.emitToFriends(server, userId, {
                type: "friend:status",
                body: { userId, status: PresenceStatus.Online }
            });
        }
    }

    async handleDisconnect(server: Server, userId: string, socketId: string): Promise<void> {
        this.connectionRegistry.setOffline(userId, socketId);
        if (!this.connectionRegistry.isOnline(userId)) {
            await this.emitToFriends(server, userId, {
                type: "friend:status",
                body: { userId, status: PresenceStatus.Offline }
            });
        }
    }

    emitTo(server: Server, userId: string, event: { type: string; body: unknown }): void {
        const sockets = this.connectionRegistry.getSockets(userId);
        sockets.forEach(socketId => {
            server.to(socketId).emit(event.type, event.body);
        });
    }

    private async emitToFriends(server: Server, userId: string, event: { type: string; body: unknown }): Promise<void> {
        const friends = await this.friendsService.getFriends(userId);
        friends.forEach(friend => this.emitTo(server, friend.id, event));
    }
}
