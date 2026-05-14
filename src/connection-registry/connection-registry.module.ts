import { Module } from "@nestjs/common";
import { ConnectionRegistryService } from "./connection-registry.service";

@Module({
    providers: [ConnectionRegistryService],
    exports: [ConnectionRegistryService],
})
export class ConnectionRegistryModule {}
