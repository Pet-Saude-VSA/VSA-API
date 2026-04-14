import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('sync')
export class SyncController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard) // 🔒 Fechadura ativada! Sem Token não entra.
  @Get('initial-load')
  async initialLoad(@Request() req) {
    // Graças ao nosso JwtStrategy, sabemos exatamente quem é o agente logado
    const agente = req.user;
    
    // Busca os imóveis e visitas reais no banco de dados via Prisma
    const locations = await this.prisma.location.findMany();
    const encounters = await this.prisma.encounter.findMany();

    // Retorna tudo empacotado no padrão FHIR (Bundle) conforme o seu MODELAGEM_FHIR.md
    return {
      resourceType: "Bundle",
      type: "searchset",
      total: locations.length + encounters.length,
      entry: [
        ...locations.map(loc => ({
          resource: {
            resourceType: "Location",
            id: loc.id,
            physicalType: { text: loc.physicalType }
          }
        })),
        ...encounters.map(enc => ({
          resource: {
            resourceType: "Encounter",
            id: enc.id,
            status: enc.status,
            subject: { reference: `Location/${enc.locationId}` },
            participant: [
              { individual: { reference: `PractitionerRole/${agente.practitionerId}` } }
            ]
          }
        }))
      ]
    };
  }
}