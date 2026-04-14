import { PrismaService } from '../prisma/prisma.service';
export declare class SyncController {
    private prisma;
    constructor(prisma: PrismaService);
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
}
