import { Injectable } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { ConnectionRegistryService, PresenceStatus } from "src/connection-registry/connection-registry.service";
import ClientConnectedEvent from "src/events/client-connected.event";
import ClientDisconnectedEvent from "src/events/client-disconnected.event";
import FriendStatusChanged from "src/events/friend-status-changed.event";
import { FriendsService } from "src/friends/friends.service";

@Injectable()
export class PresenceService {

    constructor(
        private readonly connectionRegistry: ConnectionRegistryService,
        private readonly friendsService: FriendsService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    @OnEvent('client.connected')
    async onClientConnected(payload: ClientConnectedEvent) {
        const { userId, socketId } = payload;
        const wasOffline = !this.connectionRegistry.isOnline(userId);
        this.connectionRegistry.setOnline(userId, socketId);

        if (wasOffline) {
            const friendsConnections = await this.getFriendsConnections(userId);
            this.eventEmitter.emit(
                "friend.status.changed",
                new FriendStatusChanged(
                    userId,
                    PresenceStatus.Online,
                    friendsConnections
                )
            )
        }
    }

    @OnEvent('client.disconnected')
    async onClientDisconnected(payload: ClientDisconnectedEvent) {
        const { userId, socketId } = payload;

        this.connectionRegistry.setOffline(userId, socketId);
        if (!this.connectionRegistry.isOnline(userId)) {
            const friendsConnections = await this.getFriendsConnections(userId);

            this.eventEmitter.emit(
                "friend.status.changed",
                new FriendStatusChanged(
                    userId,
                    PresenceStatus.Offline,
                    friendsConnections
                )
            )
        }

    }

    private async getFriendsConnections(userId: string): Promise<Set<string>> {
        const friends = await this.friendsService.getFriends(userId);
        return new Set(friends.map(f => f.id));
    }
}
