import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get('health')
  @HttpCode(200)
  checkHealth() {
    return {
      status: 'OK',
      message: 'API Pet-Saúde VSA rodando com NestJS e Prisma! 🚀',
      timestamp: new Date().toISOString()
    };
  }
}