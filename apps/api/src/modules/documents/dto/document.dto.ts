import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";
import { DocumentStatus } from "@avala/db";

export class CreateDocumentDto {
  @ApiProperty({ description: "Template code (e.g., EC0249-E1-001)" })
  @IsString()
  @IsNotEmpty()
  templateCode!: string;

  @ApiProperty({ description: "Custom document title", required: false })
  @IsString()
  @IsOptional()
  title?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ description: "Document title", required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: "Document content (JSON with section data)",
    required: false,
    example: { "section-1": { value: "Content here", subsections: {} } },
  })
  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @ApiProperty({
    description: "Document status",
    enum: DocumentStatus,
    required: false,
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;
}
