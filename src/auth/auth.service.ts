import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(cpf: string, pass: string) {
    // 1. Busca o usuário no banco pelo CPF
    const user = await this.prisma.user.findUnique({
      where: { cpf: cpf },
    });

    if (!user) {
      throw new UnauthorizedException('CPF ou senha incorretos');
    }

    // 2. Compara a senha digitada com o Hash do banco
    const isMatch = await bcrypt.compare(pass, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedException('CPF ou senha incorretos');
    }

    // 3. Monta o Payload (os dados que vão dentro do Token JWT)
    const payload = { 
      sub: user.id, 
      cpf: user.cpf, 
      role: user.role, 
      practitionerId: user.practitionerId 
    };

    // 4. Retorna o Token assinado
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}