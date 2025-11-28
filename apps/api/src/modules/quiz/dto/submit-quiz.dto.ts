import { ApiProperty } from "@nestjs/swagger";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class QuestionAnswerDto {
  @ApiProperty({ description: "Question ID" })
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @ApiProperty({
    description:
      "Answer value (string, array, or object depending on question type)",
    example: "A",
  })
  @IsNotEmpty()
  answer!: string | string[] | Record<string, string>;

  @ApiProperty({
    description: "Time spent on question in seconds",
    required: false,
  })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}

export class SubmitQuizDto {
  @ApiProperty({ description: "Quiz ID" })
  @IsUUID()
  @IsNotEmpty()
  quizId!: string;

  @ApiProperty({
    description: "Array of question answers",
    type: [QuestionAnswerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionAnswerDto)
  answers!: QuestionAnswerDto[];

  @ApiProperty({ description: "Total time spent on quiz in seconds" })
  @IsNumber()
  totalTimeSpent!: number;
}
