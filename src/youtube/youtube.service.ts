import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ItemInfo, YoutubeResponseDto } from './dto/youtube-response.dto';

@Injectable()
export class YoutubeService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async searchVideos(query: string[]): Promise<ItemInfo[]> {
    const apiKey = this.config.get<string>('API_KEY');

    const { data } = await firstValueFrom(
      this.http.get<YoutubeResponseDto>(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            part: 'snippet',
            maxResults: 25,
            q: query.join('|'),
            key: apiKey,
            type: 'video',
          },
        },
      ),
    );
    return data.items;
  }
}
