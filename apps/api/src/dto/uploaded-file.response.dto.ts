import { ApiProperty } from '@nestjs/swagger';

export class UploadedFileResponseDto {
  @ApiProperty({
    description: 'File destination URL',
    type: String,
    example: 'https://drive.google.com/uc?id=1__8oKYwPEOlXZ6Ls6GfQWm8G4g0Z3yh-&export=download'
  })
  destUrl: string;

  @ApiProperty({
    description: 'File name',
    type: String,
    example: 'example.jpg',
  })
  name: string;

  @ApiProperty({
    description: 'File upload date',
    type: Date,
    example: '2025-03-20T00:00:00.000Z',
  })
  uploaded_at: Date;

  constructor(partial: Partial<UploadedFileResponseDto>) {
    this.destUrl = partial.destUrl;
    this.name = partial.name;
    this.uploaded_at = partial.uploaded_at;
  }
}