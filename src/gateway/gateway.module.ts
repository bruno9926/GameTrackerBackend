import { Module } from "@nestjs/common";
import { AppGateway } from "./gateway.gateway";
import { SecurityModule } from "src/security/security.module";
import { PresenceModule } from "src/presence/presence.module";
import { ConnectionRegistryModule } from "src/connection-registry/connection-registry.module";

@Module({
  imports: [SecurityModule, PresenceModule, ConnectionRegistryModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
