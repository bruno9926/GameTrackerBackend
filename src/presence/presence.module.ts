import { Module } from "@nestjs/common";
import { PresenceService } from "./presence.service";
import { ConnectionRegistryModule } from "src/connection-registry/connection-registry.module";
import { FriendsModule } from "src/friends/friends.module";

@Module({
    imports: [ConnectionRegistryModule, FriendsModule],
    providers: [PresenceService],
    exports: [PresenceService],
})
export class PresenceModule {}
