import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";

export class UploadFilesDto {
    @ApiProperty({
        description: 'An array of file URL strings to be uploaded',
        example: ['https://example.com/image1.png', 'https://example.com/image2.png'],
    })
    @IsArray()
    @IsString({ each: true })
    urls: string[];
}