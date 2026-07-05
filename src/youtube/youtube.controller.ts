import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { YoutubeService } from './youtube.service';
import { ItemInfo } from './dto/youtube-response.dto';

@ApiTags('youtube')
@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('list')
  @ApiOperation({ summary: 'Retorna os 25 primeiros vídeos com base na busca' })
  @ApiOkResponse({
    description: 'Mensagem de sucesso',
  })
  @ApiQuery({
    name: 'query',
    required: true,
    description:
      'Termos de busca separados por vírgula (ex: "música,vídeo,comédia")',
    type: String,
  })
  getVideos(@Query('query') query: string): Promise<ItemInfo[]> {
    const queryArray = query.split(',').map((term) => term.trim());
    return this.youtubeService.searchVideos(queryArray);
  }
}
