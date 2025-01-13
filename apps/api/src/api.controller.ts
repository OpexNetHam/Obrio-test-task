import { Body, Controller, Get, Post, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiService } from './api.service';
import { UploadFilesDto } from '@app/common';
import { UploadedFileResponseDto } from './dto/uploaded-file.response.dto';
import { FilesStatusResponseDto } from './dto/files-status.response.dto';

@ApiTags('files')
@Controller('files')
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('links')
  @ApiOperation({ summary: 'Queue file links for upload' })
  @ApiResponse({ status: 201, description: 'Files have been queued.', type: FilesStatusResponseDto, isArray: true })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async postLinks(@Body() fileLinks: UploadFilesDto): Promise<FilesStatusResponseDto[]> {
    const files = await this.apiService.create(fileLinks);
    return files.map((file) =>  new FilesStatusResponseDto(file));
  }

  @Get('links')
  @ApiOperation({ summary: 'Retrieve all queued file links' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved files.', type: UploadedFileResponseDto })
  async getLinks(): Promise<UploadedFileResponseDto[]> {
    const files = await this.apiService.getAllUploadedFiles();
    return files.map((file) =>  new UploadedFileResponseDto(file));
  }

  @Get('status')
  @ApiOperation({ summary: 'Retrieve all files and their status' })
  @ApiResponse({ status: 200, description: 'Files with status', type: FilesStatusResponseDto, isArray: true })
  async getFilesStatus(): Promise<FilesStatusResponseDto[]> {
    const files = await this.apiService.getAllFileStatuses();
    return files.map((file) =>  new FilesStatusResponseDto(file));
  }
}