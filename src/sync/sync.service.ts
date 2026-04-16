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

    // 1.1. Valida se o bundle possui entries em formato de array
    if (!Array.isArray(bundle.entry)) {
      throw new BadRequestException('Payload inválido. Esperado `bundle.entry` como array de itens.');
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
            const encounterData = {
              id: resource.id,
              locationId: resource.subject?.reference?.replace('Location/', '') || '',
              status: resource.status,
              date: new Date(resource.period?.start || new Date()),
            };

            await tx.encounter.upsert({
              where: { id: resource.id },
              create: encounterData,
              update: encounterData,
            });
            encountersCreated++;
          } 
          else if (resource.resourceType === 'Specimen') {
            const specimenData = {
              id: resource.id,
              encounterId: resource.request?.[0]?.reference?.replace('Encounter/', '') || '',
              type: resource.type?.text || 'Amostra não especificada',
            };

            await tx.specimen.upsert({
              where: { id: resource.id },
              create: specimenData,
              update: specimenData,
            });
            specimensCreated++;
          }
          else if (resource.resourceType === 'Observation') {
            const observationData = {
              id: resource.id,
              encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
              code: resource.code?.text || 'Foco não especificado',
            };

            await tx.observation.upsert({
              where: { id: resource.id },
              create: observationData,
              update: observationData,
            });
            observationsCreated++;
          }
          else if (resource.resourceType === 'Procedure') {
            const procedureData = {
              id: resource.id,
              encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
              name: resource.code?.text || 'Tratamento não especificado',
            };

            await tx.procedure.upsert({
              where: { id: resource.id },
              create: procedureData,
              update: procedureData,
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