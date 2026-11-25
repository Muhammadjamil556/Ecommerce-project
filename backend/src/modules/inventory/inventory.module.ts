import { Module } from '@nestjs/common';
import { AdminInventoryController } from './admin-inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({
  controllers: [AdminInventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
