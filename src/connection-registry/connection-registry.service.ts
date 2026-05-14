import { Injectable } from "@nestjs/common";

export enum PresenceStatus {
    Online = "online",
    Offline = "offline",
}

@Injectable()
export class ConnectionRegistryService {

    private connectionMap: Record<string, Set<string>> = {};

    setOnline(userId: string, socketId: string): void {
        if (!this.connectionMap[userId]) {
            this.connectionMap[userId] = new Set();
        }
        this.connectionMap[userId].add(socketId);
    }

    setOffline(userId: string, socketId: string): void {
        this.connectionMap[userId]?.delete(socketId);
    }

    isOnline(userId: string): boolean {
        return (this.connectionMap[userId]?.size ?? 0) > 0;
    }

    getStatus(userId: string): PresenceStatus {
        return this.isOnline(userId) ? PresenceStatus.Online : PresenceStatus.Offline;
    }

    getStatuses(userIds: string[]): Record<string, PresenceStatus> {
        return Object.fromEntries(userIds.map(id => [id, this.getStatus(id)]));
    }

    getSockets(userId: string): Set<string> {
        return this.connectionMap[userId] ?? new Set();
    }
}
