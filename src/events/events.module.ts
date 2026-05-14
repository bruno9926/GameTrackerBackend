import { Module } from "@nestjs/common";
import { EventsGateway } from "./events.gateway";
import { SecurityModule } from "src/security/security.module";
import { FriendsModule } from "src/friends/friends.module";
import { PresenceModule } from "src/presence/presence.module";

@Module({
  imports: [SecurityModule, FriendsModule, PresenceModule],
  providers: [EventsGateway]
})
export class EventsModule {}
