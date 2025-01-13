import { UPLOAD_STATUS } from '@app/common';
import { ApiProperty } from '@nestjs/swagger';

export class FilesStatusResponseDto {
  @ApiProperty({
    description: 'File destination url',
    type: String,
    example: 'https://drive.google.com/uc?id=1W8LIVYHlSN4fMjsuIPZx-Qjt8Hrwu_mV&export=download',
  })
  destUrl?: string;

  @ApiProperty({
    description: 'File status',
    type: String,
    enum: UPLOAD_STATUS,
    example: UPLOAD_STATUS.QUEUED,
  })
  status?: UPLOAD_STATUS;

  @ApiProperty({
    description: 'File original url',
    type: String,
    example: 'https://drive.google.com/uc?id=1W8LIVYHlSN4fMjsuIPZx-Qjt8Hrwu_mV&export=download',
  })
  originalUrl: string;

  @ApiProperty({
    description: 'File name',
    type: String,
    example: 'example.jpg',
  })
  name?: string;

  @ApiProperty({
    description: 'File upload date',
    type: Date,
    example: '2025-03-20T00:00:00.000Z',
  })
  uploaded_at?: Date;

  constructor(partial: Partial<FilesStatusResponseDto>) {
    this.destUrl = partial.destUrl;
    this.status = partial.status;
    this.originalUrl = partial.originalUrl;
    this.name = partial.name;
    this.uploaded_at = partial.uploaded_at;
  }
}
