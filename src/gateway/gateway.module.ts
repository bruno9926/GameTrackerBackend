import { Module } from "@nestjs/common";
import { AppGateway } from "./gateway.gateway";
import { SecurityModule } from "src/security/security.module";
import { PresenceModule } from "src/presence/presence.module";

@Module({
  imports: [SecurityModule, PresenceModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
