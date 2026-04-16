import { PrismaService } from '../prisma/prisma.service';
export declare class SyncService {
    private prisma;
    constructor(prisma: PrismaService);
    processBulkSync(bundle: any): Promise<{
        message: string;
        resumo: {
            visitas: number;
            amostras: number;
            achados: number;
            tratamentos: number;
        };
    }>;
}
