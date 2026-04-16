import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from './sync.service';
export declare class SyncController {
    private prisma;
    private syncService;
    constructor(prisma: PrismaService, syncService: SyncService);
    initialLoad(req: any): Promise<{
        resourceType: string;
        type: string;
        total: number;
        entry: ({
            resource: {
                resourceType: string;
                id: string;
                physicalType: {
                    text: string;
                };
            };
        } | {
            resource: {
                resourceType: string;
                id: string;
                status: string;
                subject: {
                    reference: string;
                };
                participant: {
                    individual: {
                        reference: string;
                    };
                }[];
            };
        })[];
    }>;
    uploadVisits(fhirBundle: any): Promise<{
        message: string;
        resumo: {
            visitas: number;
            amostras: number;
            achados: number;
            tratamentos: number;
        };
    }>;
}
