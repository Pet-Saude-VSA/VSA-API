import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'chave-secreta-vsa-super-segura', // A mesma chave que usamos no auth.module
    });
  }

  async validate(payload: any) {
    // O que retornarmos aqui ficará disponível em req.user nas rotas protegidas
    return { 
      id: payload.sub, 
      cpf: payload.cpf, 
      role: payload.role, 
      practitionerId: payload.practitionerId 
    };
  }
}