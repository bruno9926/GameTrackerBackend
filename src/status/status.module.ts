import { Module } from "@nestjs/common";
import { StatusGateway } from "./status.gateway";
import { SecurityModule } from "src/security/security.module";
import { FriendsModule } from "src/friends/friends.module";
import { UsersModule } from "src/users/users.module";

@Module({
  imports: [SecurityModule, FriendsModule, UsersModule],
  providers: [StatusGateway]
})
export class StatusModule {}