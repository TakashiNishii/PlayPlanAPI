import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  ItemInfo,
  YoutubeResponseDto,
  YoutubeVideoDetailsResponseDto,
} from './dto/youtube-response.dto';

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
    // Pego os ids dos videos retornados e faço uma nova requisição para pegar a duração dos videos
    const videoIds = data.items.map((item) => item.id.videoId).join(',');
    const { data: videoData } = await firstValueFrom(
      this.http.get<YoutubeVideoDetailsResponseDto>(
        'https://www.googleapis.com/youtube/v3/videos',
        {
          params: {
            part: 'contentDetails',
            id: videoIds,
            key: apiKey,
          },
        },
      ),
    );
    // Mapeio a duração dos vídeos para cada item
    const videoDurations = videoData.items.reduce<Record<string, string>>(
      (acc, item) => {
        acc[item.id] = this.parseDuration(item.contentDetails.duration);
        return acc;
      },
      {},
    );

    return data.items.map((item) => ({
      ...item,
      duration: videoDurations[item.id.videoId],
    }));
  }

  private parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) {
      return '00:00';
    }

    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const formattedMinutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const formattedSeconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  }
}
