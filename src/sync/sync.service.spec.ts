import { BadRequestException } from '@nestjs/common';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  it('should reject transaction bundle type', async () => {
    const prismaMock = {
      $transaction: jest.fn(),
    };
    const service = new SyncService(prismaMock as any);

    await expect(
      service.processBulkSync({
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [],
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'Payload inválido. Esperado FHIR Bundle do tipo collection para este endpoint.',
      ),
    );
  });

  it('should process collection bundle', async () => {
    const txMock = {
      encounter: { upsert: jest.fn() },
      specimen: { upsert: jest.fn() },
      observation: { upsert: jest.fn() },
      procedure: { upsert: jest.fn() },
    };
    const prismaMock = {
      $transaction: jest.fn(async (callback: any) => callback(txMock)),
    };
    const service = new SyncService(prismaMock as any);

    const result = await service.processBulkSync({
      resourceType: 'Bundle',
      type: 'collection',
      entry: [],
    });

    expect(result).toEqual({
      message: 'Sincronização em lote concluída com sucesso (ACID OK)!',
      resumo: {
        visitas: 0,
        amostras: 0,
        achados: 0,
        tratamentos: 0,
      },
    });
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });
});
