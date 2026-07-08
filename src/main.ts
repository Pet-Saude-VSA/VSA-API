import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // remove campos não declarados no DTO
      forbidNonWhitelisted: true, // rejeita payload com lixo extra
      transform: true,        // converte JSON puro em instância da classe
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();