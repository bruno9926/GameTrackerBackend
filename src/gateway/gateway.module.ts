import { Module } from "@nestjs/common";
import { AppGateway } from "./gateway.gateway";
import { SecurityModule } from "src/security/security.module";
import { FriendsModule } from "src/friends/friends.module";
import { ConnectionRegistryModule } from "src/connection-registry/connection-registry.module";

@Module({
  imports: [SecurityModule, FriendsModule, ConnectionRegistryModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
