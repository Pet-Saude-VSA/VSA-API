import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('SyncController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Generate valid auth token
    const payload = {
      sub: 'test-user-id',
      cpf: '12345678900',
      role: 'agente',
      practitionerId: 'test-practitioner-id',
    };
    
    token = await jwtService.signAsync(payload);

    // Seed required default location
    await prisma.location.upsert({
      where: { id: 'imovel-default' },
      update: {},
      create: {
        id: 'imovel-default',
        physicalType: 'House',
      },
    });
  });

  afterAll(async () => {
    // Cleanup seeded and test data
    await prisma.observation.deleteMany({
      where: { encounterId: { startsWith: 'e2e-' } },
    });
    await prisma.specimen.deleteMany({
      where: { encounterId: { startsWith: 'e2e-' } },
    });
    await prisma.procedure.deleteMany({
      where: { encounterId: { startsWith: 'e2e-' } },
    });
    await prisma.encounter.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
    await prisma.location.deleteMany({
      where: { id: 'imovel-default' },
    });
    await app.close();
  });

  it('should successfully upload a valid bulk bundle', async () => {
    const payload = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Encounter',
            id: 'e2e-visit-1',
            status: 'finished',
            subject: { reference: 'Location/imovel-default' },
            period: { start: '2026-07-09T12:00:00Z' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'e2e-obs-1',
            encounter: { reference: 'Encounter/e2e-visit-1' },
            code: { text: 'depositos-inspecionados' },
            valueQuantity: 3,
          },
        },
        {
          resource: {
            resourceType: 'Specimen',
            id: 'e2e-spec-1',
            request: [{ reference: 'Encounter/e2e-visit-1' }],
            type: { text: 'A1' },
            tubitoId: 'TUB-1002',
            quantidade: 2,
          },
        },
        {
          resource: {
            resourceType: 'Procedure',
            id: 'e2e-proc-1',
            encounter: { reference: 'Encounter/e2e-visit-1' },
            code: { text: 'pyriproxyfen' },
            realizado: true,
            quantidade: 15.5,
          },
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/sync/upload-visits')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);

    expect(response.body).toEqual({
      message: 'Sincronização em lote concluída com sucesso (ACID OK)!',
      resumo: {
        visitas: 1,
        amostras: 1,
        achados: 1,
        tratamentos: 1,
      },
    });

    // Verify database state
    const encounter = await prisma.encounter.findUnique({ where: { id: 'e2e-visit-1' } });
    const obs = await prisma.observation.findUnique({ where: { id: 'e2e-obs-1' } });
    const specimen = await prisma.specimen.findUnique({ where: { id: 'e2e-spec-1' } });
    const procedure = await prisma.procedure.findUnique({ where: { id: 'e2e-proc-1' } });

    expect(encounter).toBeDefined();
    expect(encounter?.status).toBe('finished');
    expect(obs?.valueQuantity).toBe(3);
    expect(specimen?.tubitoId).toBe('TUB-1002');
    expect(procedure?.quantidade).toBe(15.5);
  });

  it('should trigger rollback and not save anything if one entity fails', async () => {
    // Scenario: The bundle contains an Encounter (which would normally succeed),
    // but the Observation references a non-existent Encounter ID.
    // This foreign key constraint violation must trigger a complete transaction rollback.
    const payload = {
      resourceType: 'Bundle',
      type: 'collection',
      entry: [
        {
          resource: {
            resourceType: 'Encounter',
            id: 'e2e-visit-failed-rollback',
            status: 'finished',
            subject: { reference: 'Location/imovel-default' },
            period: { start: '2026-07-09T12:00:00Z' },
          },
        },
        {
          resource: {
            resourceType: 'Observation',
            id: 'e2e-obs-failed-rollback',
            encounter: { reference: 'Encounter/non-existent-encounter-id-xyz' },
            code: { text: 'depositos-inspecionados' },
            valueQuantity: 5,
          },
        },
      ],
    };

    const response = await request(app.getHttpServer())
      .post('/sync/upload-visits')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(400);

    expect(response.body.message).toContain('Erro ao processar lote. Nenhuma alteração foi salva.');

    // Verify database state: neither the Encounter nor the Observation should exist
    const encounter = await prisma.encounter.findUnique({
      where: { id: 'e2e-visit-failed-rollback' },
    });
    const obs = await prisma.observation.findUnique({
      where: { id: 'e2e-obs-failed-rollback' },
    });

    expect(encounter).toBeNull();
    expect(obs).toBeNull();
  });
});
