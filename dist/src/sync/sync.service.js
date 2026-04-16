"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SyncService = class SyncService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async processBulkSync(bundle) {
        if (bundle.resourceType !== 'Bundle' || bundle.type !== 'transaction') {
            throw new common_1.BadRequestException('Payload inválido. Esperado FHIR Bundle do tipo transaction.');
        }
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                let encountersCreated = 0;
                let specimensCreated = 0;
                let observationsCreated = 0;
                let proceduresCreated = 0;
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`Erro ao processar lote. Nenhuma alteração foi salva. Detalhes: ${error.message}`);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SyncService);
//# sourceMappingURL=sync.service.js.map