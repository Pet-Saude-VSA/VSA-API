import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from './sync.service';

describe('SyncController', () => {
  let controller: SyncController;
  let syncService: SyncService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    location: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    encounter: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockSyncService = {
    processBulkSync: jest.fn().mockResolvedValue({
      message: 'Sincronização em lote concluída com sucesso (ACID OK)!',
      resumo: {
        visitas: 0,
        amostras: 0,
        achados: 0,
        tratamentos: 0,
      },
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SyncService, useValue: mockSyncService },
      ],
    }).compile();

    controller = module.get<SyncController>(SyncController);
    syncService = module.get<SyncService>(SyncService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
