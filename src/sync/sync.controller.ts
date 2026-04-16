import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  // Injetamos o Prisma (para o GET) e o SyncService (para o POST)
  constructor(
    private prisma: PrismaService,
    private syncService: SyncService // <-- Adicionado
  ) {}

  @UseGuards(JwtAuthGuard) 
  @Get('initial-load')
  async initialLoad(@Request() req) {
    const agente = req.user;
    
    const locations = await this.prisma.location.findMany();
    const encounters = await this.prisma.encounter.findMany();

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
  @UseGuards(JwtAuthGuard) // Protegida! Só entra com o Token do login.
  @Post('upload-visits')
  async uploadVisits(@Body() fhirBundle: any) {
    // Repassa o pacotão de dados pro Service processar com segurança (Transação ACID)
    return this.syncService.processBulkSync(fhirBundle);
  }
}