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

    const maxResults = 200;
    const pageSize = 50;
    const searchItems: ItemInfo[] = [];
    let nextPageToken: string | undefined;

    do {
      const { data } = await firstValueFrom(
        this.http.get<YoutubeResponseDto>(
          'https://www.googleapis.com/youtube/v3/search',
          {
            params: {
              part: 'snippet',
              maxResults: pageSize,
              q: query.join('|'),
              key: apiKey,
              type: 'video',
              pageToken: nextPageToken,
            },
          },
        ),
      );

      searchItems.push(...data.items);
      nextPageToken = data.nextPageToken;
    } while (searchItems.length < maxResults && nextPageToken);

    const items = searchItems.slice(0, maxResults);
    const videoIds = items.map((item) => item.id.videoId);
    const videoDurations: Record<string, string> = {};

    // O endpoint videos aceita no máximo 50 IDs por chamada.
    for (let index = 0; index < videoIds.length; index += pageSize) {
      const idsBatch = videoIds.slice(index, index + pageSize).join(',');

      const { data: videoData } = await firstValueFrom(
        this.http.get<YoutubeVideoDetailsResponseDto>(
          'https://www.googleapis.com/youtube/v3/videos',
          {
            params: {
              part: 'contentDetails',
              id: idsBatch,
              key: apiKey,
            },
          },
        ),
      );

      videoData.items.forEach((item) => {
        videoDurations[item.id] = this.parseDuration(
          item.contentDetails.duration,
        );
      });
    }

    return items.map((item) => ({
      ...item,
      duration: videoDurations[item.id.videoId] ?? '00:00',
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
