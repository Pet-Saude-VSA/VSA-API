import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVisitsBundleDto } from './dto/upload-visits-bundle.dto'; // Importe o DTO que criamos

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async processBulkSync(bundle: UploadVisitsBundleDto) {
    // 1. Valida se é um bundle no contrato suportado por este endpoint
    if (bundle.resourceType !== 'Bundle') {
      throw new BadRequestException('Payload inválido. Esperado FHIR Bundle.');
    }

    if (bundle.type !== 'collection') {
      throw new BadRequestException('Payload inválido. Esperado FHIR Bundle do tipo collection para este endpoint.');
    }

    // 1.1. Valida se o bundle possui entries em formato de array
    if (!Array.isArray(bundle.entry)) {
      throw new BadRequestException('Payload inválido. Esperado `bundle.entry` como array de itens.');
    }

    if (bundle.entry.some((entry: any) => entry?.request)) {
      throw new BadRequestException('Payload inválido. Este endpoint suporta apenas entries com `resource` (sem `entry.request`).');
    }

    // 2. Inicia a transação ACID no Banco
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let encountersCreated = 0;
        let specimensCreated = 0;
        let observationsCreated = 0;
        let proceduresCreated = 0;

        // 3. Desmembra o payload e processa ordenadamente
        const entries = bundle.entry;

        const encounters = entries.filter((e) => e.resource.resourceType === 'Encounter');
        const specimens = entries.filter((e) => e.resource.resourceType === 'Specimen');
        const observations = entries.filter((e) => e.resource.resourceType === 'Observation');
        const procedures = entries.filter((e) => e.resource.resourceType === 'Procedure');

        // 3.1. Processa todos os Encounters
        for (const entry of encounters) {
          const resource = entry.resource;
          const encounterData = {
            id: resource.id,
            locationId: resource.subject?.reference?.replace('Location/', '') || '',
            status: resource.status || 'finished',
            date: new Date(resource.period?.start || new Date()),
          };

          await tx.encounter.upsert({
            where: { id: resource.id },
            create: encounterData,
            update: encounterData,
          });
          encountersCreated++;
        }

        // 3.2. Processa todos os Specimens (Amostras)
        for (const entry of specimens) {
          const resource = entry.resource;
          const specimenData = {
            id: resource.id,
            encounterId: resource.request?.[0]?.reference?.replace('Encounter/', '') || '',
            type: resource.type?.text || 'Amostra não especificada',
            tubitoId: resource.tubitoId || null,
            quantidade: resource.quantidade ?? 1,
          };

          await tx.specimen.upsert({
            where: { id: resource.id },
            create: {
              ...specimenData,
              resultadoLaboratorio: null,
            },
            update: {
              encounterId: specimenData.encounterId,
              type: specimenData.type,
              tubitoId: specimenData.tubitoId,
              quantidade: specimenData.quantidade,
            },
          });
          specimensCreated++;
        }

        // 3.3. Processa todas as Observations (Achados/Depósitos)
        for (const entry of observations) {
          const resource = entry.resource;
          const observationData = {
            id: resource.id,
            encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
            code: resource.code?.text || 'Foco não especificado',
            valueQuantity: resource.valueQuantity ?? 0,
          };

          await tx.observation.upsert({
            where: { id: resource.id },
            create: observationData,
            update: observationData,
          });
          observationsCreated++;
        }

        // 3.4. Processa todos os Procedures (Tratamentos Químicos)
        for (const entry of procedures) {
          const resource = entry.resource;
          const procedureData = {
            id: resource.id,
            encounterId: resource.encounter?.reference?.replace('Encounter/', '') || '',
            name: resource.code?.text || 'Tratamento não especificado',
            realizado: resource.realizado ?? true,
            quantidade: resource.quantidade !== undefined ? resource.quantidade : null,
          };

          await tx.procedure.upsert({
            where: { id: resource.id },
            create: procedureData,
            update: procedureData,
          });
          proceduresCreated++;
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