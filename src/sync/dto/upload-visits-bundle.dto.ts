import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReferenceWrapperDto {
  @IsOptional()
  @IsString()
  reference?: string;
}

class PeriodDto {
  @IsOptional()
  @IsString()
  start?: string;
}

class TextCodeDto {
  @IsOptional()
  @IsString()
  text?: string;
}

export class ResourceDto {
  @IsIn(['Encounter', 'Specimen', 'Observation', 'Procedure'])
  resourceType: 'Encounter' | 'Specimen' | 'Observation' | 'Procedure';

  @IsString()
  @IsNotEmpty()
  id: string;

  // --- Encounter ---
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReferenceWrapperDto)
  subject?: ReferenceWrapperDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PeriodDto)
  period?: PeriodDto;

  // --- Specimen ---
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ReferenceWrapperDto)
  request?: ReferenceWrapperDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TextCodeDto)
  type?: TextCodeDto;

  @IsOptional()
  @IsString()
  tubitoId?: string;

  @IsOptional()
  @ValidateIf((o) => o.resourceType === 'Specimen')
  @IsInt()
  @Min(1)
  @ValidateIf((o) => o.resourceType === 'Procedure')
  @IsNumber()
  @Min(0)
  quantidade?: number;

  // --- Observation / Procedure ---
  @IsOptional()
  @ValidateNested()
  @Type(() => ReferenceWrapperDto)
  encounter?: ReferenceWrapperDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TextCodeDto)
  code?: TextCodeDto;

  @IsOptional()
  @ValidateIf((o) => o.resourceType === 'Observation')
  @IsInt()
  @Min(0)
  valueQuantity?: number;

  @IsOptional()
  @ValidateIf((o) => o.resourceType === 'Procedure')
  @IsBoolean()
  realizado?: boolean;

export class EntryDto {
  @ValidateNested()
  @Type(() => ResourceDto)
  resource: ResourceDto;
}

export class UploadVisitsBundleDto {
  @IsIn(['Bundle'])
  resourceType: 'Bundle';

  @IsIn(['collection'])
  type: 'collection';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntryDto)
  entry: EntryDto[];
}