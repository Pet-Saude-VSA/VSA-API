# 🏛️ Modelagem de Domínio e Padrão FHIR

Este documento define a arquitetura de dados do sistema Pet-Saúde VSA, mapeando os requisitos do formulário PNCD/LIRAa (SUS) para os recursos internacionais do padrão HL7 FHIR.

---

## 1. Mapeamento Territorial (Location)

Utilizamos o recurso `Location` para representar tanto os Quarteirões quanto os Imóveis. A hierarquia é mantida através do atributo `partOf`.

- **Quarteirão:**
  - `physicalType`: `{"coding": [{"code": "blk", "display": "Block"}]}`
- **Imóvel (Residencial/Comercial/Terreno Baldio):**
  - `physicalType`: `{"coding": [{"code": "ho", "display": "House"}]}`
  - `partOf`: referência para o ID do Quarteirão.

```json
{
  "resourceType": "Location",
  "id": "imovel-123",
  "physicalType": {
    "coding": [{ "code": "ho", "display": "House" }]
  },
  "partOf": {
    "reference": "Location/quarteirao-456"
  }
}
```

## 2. O Agente de Endemias (Practitioner e PractitionerRole)

O agente (ACE) é a pessoa física (Practitioner), mas a sua atuação no sistema dá-se pelo seu papel (PractitionerRole).

### PractitionerRole

- `code`: define a ocupação, por exemplo, Agente de Combate às Endemias.

```json
{
  "resourceType": "PractitionerRole",
  "id": "role-ace-789",
  "practitioner": { "reference": "Practitioner/joao-silva" },
  "code": [
    { "coding": [{ "code": "5151-40", "display": "Agente de Combate às Endemias" }] }
  ]
}
```

## 3. A Visita Domiciliar (Encounter)

O recurso Encounter é o "coração" da nossa modelagem. Ele amarra quem fez a visita (Agente), onde foi feita (Imóvel) e qual foi o desfecho.

### Status

- `planned`: visita pendente no roteiro do dia.
- `finished`: visita realizada com sucesso.
- `cancelled`: casa fechada ou recusada.

### Vínculos

- `class`: elemento obrigatório do `Encounter` (em FHIR R4, do tipo `Coding`), indicando o contexto do encontro.
- `location.location`: referência ao Location, representando o imóvel visitado.
- `participant`: referência ao PractitionerRole, o agente.
- `subject`: neste cenário territorial, não é usado para `Location`; deve referenciar `Patient`/`Group` quando houver sujeito clínico.

```json
{
  "resourceType": "Encounter",
  "status": "finished",
  "class": {
    "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
    "code": "HH",
    "display": "home health"
  },
  "location": [
    {
      "location": { "reference": "Location/imovel-123" }
    }
  ],
  "participant": [
    { "individual": { "reference": "PractitionerRole/role-ace-789" } }
  ]
}
```

## 4. Achados Quantitativos (Observation)

Tudo o que o agente conta ou inspeciona é uma Observation vinculada ao Encounter.

### Depósitos Inspecionados / Eliminados

- Utilizamos `valueQuantity` para o número inteiro.
- O código da observação diz o que está a ser contado.

```json
{
  "resourceType": "Observation",
  "status": "final",
  "encounter": { "reference": "Encounter/visita-001" },
  "code": {
    "coding": [{ "code": "depositos-inspecionados", "display": "Depósitos Inspecionados" }]
  },
  "valueQuantity": {
    "value": 5,
    "unit": "depósitos"
  }
}
```

## 5. O Tubito de Larva (Specimen)

A coleta física de larvas para análise laboratorial.

### Identificação e Classificação

- `identifier`: código de barras ou numeração única do tubito.
- `type`: classificação do depósito onde foi encontrado, por exemplo A1, A2, B, C, D1, D2 ou E.
- `collection.collector`: referência ao `Practitioner` responsável pela coleta.

```json
{
  "resourceType": "Specimen",
  "identifier": [{ "value": "TUBITO-2023-XYZ" }],
  "type": {
    "coding": [{ "code": "A1", "display": "Depósito de Armazenamento de Água" }]
  },
  "collection": {
    "collector": { "reference": "Practitioner/joao-silva" }
  }
}
```

## 6. Tratamento Químico (Procedure)

Aplicações de larvicida ou adulticida durante a visita.

### Registro de Gramas

- O `Procedure.usedCode` identifica o insumo aplicado.
- A quantidade em gramas é registrada em uma `Observation` vinculada ao procedimento via `partOf`.

```json
{
  "resourceType": "Procedure",
  "status": "completed",
  "encounter": { "reference": "Encounter/visita-001" },
  "usedCode": [
    { "coding": [{ "code": "pyriproxyfen", "display": "Larvicida Pyriproxyfen" }] }
  ],
  "focalDevice": [
    { "action": { "coding": [{ "display": "Aplicação focal" }] } }
  ]
}
```

```json
{
  "resourceType": "Observation",
  "status": "final",
  "partOf": [{ "reference": "Procedure/proc-001" }],
  "code": {
    "coding": [{ "code": "quantidade-aplicada", "display": "Quantidade aplicada" }]
  },
  "valueQuantity": {
    "value": 25,
    "unit": "g",
    "system": "http://unitsofmeasure.org",
    "code": "g"
  }
}
```