import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';

@ApiTags('youtube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('list')
  @ApiOperation({ summary: 'Retorna os 25 primeiros vídeos com base na busca' })
  @ApiOkResponse({
    description: 'Mensagem de sucesso',
  })
  @ApiQuery({ name: 'query', required: true, description: 'Termos de busca' })
  getVideos(@Query('query') query: string) {
    return this.youtubeService.searchVideos(query);
  }
}
