import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async processBulkSync(bundle: any) {
    // 1. Valida se é um bundle de transação
    if (bundle.resourceType !== 'Bundle' || bundle.type !== 'transaction') {
      throw new BadRequestException('Payload inválido. Esperado FHIR Bundle do tipo transaction.');
    }

    // 2. Inicia a transação ACID no Banco
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let encountersCreated = 0;
        let specimensCreated = 0;
        let observationsCreated = 0;
        let proceduresCreated = 0;

        // 3. Desmembra o payload
        for (const entry of bundle.entry) {
          const resource = entry.resource;

          if (resource.resourceType === 'Encounter') {
            await tx.encounter.create({
              data: {
                id: resource.id,
                locationId: resource.subject?.reference?.replace('Location/', '') || '', 
                status: resource.status,
                date: new Date(resource.period?.start || new Date()),
              },
            });
            encountersCreated++;
          } 
          else if (resource.resourceType === 'Specimen') {
            await tx.specimen.create({
              data: {
                id: resource.id,
                encounterId: resource.request?.[0]?.reference?.replace('Encounter/', '') || '', 
                type: resource.type?.text || 'Amostra não especificada',
              },
            });
            specimensCreated++;
          }
          else if (resource.resourceType === 'Observation') {
            await tx.observation.create({
              data: {
                id: resource.id,
                encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
                code: resource.code?.text || 'Foco não especificado',
              },
            });
            observationsCreated++;
          }
          else if (resource.resourceType === 'Procedure') {
            await tx.procedure.create({
              data: {
                id: resource.id,
                encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
                name: resource.code?.text || 'Tratamento não especificado',
              },
            });
            proceduresCreated++;
          }
        }

        // Retorna um resumo do que foi salvo
        return { 
          message: 'Sincronização em lote concluída com sucesso (ACID OK)!', 
          resumo: {
            visitas: encountersCreated,
            amostras: specimensCreated,
            achados: observationsCreated,
            tratamentos: proceduresCreated
          }
        };
      });

      return result;
    } catch (error) {
      // Se der erro em qualquer item, o Prisma faz Rollback automático de TUDO
      throw new BadRequestException(`Erro ao processar lote. Nenhuma alteração foi salva. Detalhes: ${error.message}`);
    }
  }
}