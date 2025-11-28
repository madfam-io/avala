import { IsString, IsNotEmpty, IsInt, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AwardPointsDto {
  @ApiProperty({
    description: "User ID to award points to",
    example: "clx123abc",
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: "Number of points to award",
    example: 100,
    minimum: 1,
    maximum: 10000,
  })
  @IsInt()
  @Min(1)
  @Max(10000)
  points!: number;

  @ApiProperty({
    description: "Reason for awarding points",
    example: "Completed advanced module",
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
