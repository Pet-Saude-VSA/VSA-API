import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client'; // <-- Atualizado aqui

@Injectable()
export class FhirParserService {
  
  toPractitioner(user: User) { // <-- Atualizado aqui
    return {
      resourceType: 'Practitioner',
      id: user.id,
      identifier: [
        { system: 'http://gov.br/cpf', value: user.cpf },
      ],
      name: [
        { use: 'official', text: user.nome },
      ],
    };
  }
}