import { User } from '@prisma/client';
export declare class FhirParserService {
    toPractitioner(user: User): {
        resourceType: string;
        id: string;
        identifier: {
            system: string;
            value: string;
        }[];
        name: {
            use: string;
            text: string;
        }[];
    };
}
