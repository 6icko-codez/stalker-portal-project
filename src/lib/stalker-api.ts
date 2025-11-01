import axios from 'axios';
import crypto from 'crypto';

export interface StalkerConfig {
  portalUrl: string;
  macAddress: string;
  timezone?: string;
}

export interface StalkerChannel {
  id: string;
  name: string;
  number: number;
  logo?: string;
  cmd: string;
  tv_genre_id: string;
  use_http_tmp_link?: number;
  use_load_balancing?: number;
}

export interface StalkerMovie {
  id: string;
  name: string;
  o_name?: string;
  description?: string;
  pic?: string;
  logo?: string;
  cmd: string;
  year?: string;
  director?: string;
  actors?: string;
  category_id?: string;
  rating_imdb?: string;
  rating_kinopoisk?: string;
  duration?: string;
  genre_id_1?: string;
  genre_id_2?: string;
  genre_id_3?: string;
  genre_id_4?: string;
}

export interface StalkerSeries {
  id: string;
  name: string;
  o_name?: string;
  description?: string;
  pic?: string;
  logo?: string;
  cmd: string;
  year?: string;
  director?: string;
  actors?: string;
  category_id?: string;
  rating_imdb?: string;
  rating_kinopoisk?: string;
  genre_id_1?: string;
  genre_id_2?: string;
  genre_id_3?: string;
  genre_id_4?: string;
  series?: any[];
}

export interface StalkerGenre {
  id: string;
  title: string;
  alias?: string;
}

export class StalkerAPI {
  private config: StalkerConfig;
  private token?: string;
  private profile?: any;

  constructor(config: StalkerConfig) {
    this.config = {
      ...config,
      timezone: config.timezone || 'UTC',
    };
  }

  private async makeRequest(
    type: string,
    params: Record<string, any> = {}
  ): Promise<any> {
    const url = `${this.config.portalUrl}/portal.php`;
    
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
      'X-User-Agent': 'Model: MAG250; Link: WiFi',
      'Cookie': this.token ? `mac=${this.config.macAddress}; stb_lang=en; timezone=${this.config.timezone}` : `mac=${this.config.macAddress}`,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await axios.get(url, {
        params: {
          type,
          ...params,
        },
        headers,
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      throw new Error(`Stalker API Error: ${error.message}`);
    }
  }

  async handshake(): Promise<boolean> {
    try {
      const data = await this.makeRequest('stb', {
        action: 'handshake',
        prehash: Date.now().toString(),
        JsHttpRequest: '1-xml',
      });

      if (data.js?.token) {
        this.token = data.js.token;
        return true;
      }

      return false;
    } catch (error) {
      console.error('Handshake failed:', error);
      return false;
    }
  }

  async getProfile(): Promise<any> {
    try {
      const data = await this.makeRequest('stb', {
        action: 'get_profile',
        JsHttpRequest: '1-xml',
      });

      this.profile = data.js;
      return this.profile;
    } catch (error) {
      console.error('Get profile failed:', error);
      return null;
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const data = await this.makeRequest('account', {
        action: 'get_main_info',
        JsHttpRequest: '1-xml',
      });

      return data.js || null;
    } catch (error) {
      console.error('Get account info failed:', error);
      return null;
    }
  }

  async getSubscriptionInfo(): Promise<{
    expiryDate?: string;
    status?: string;
    daysRemaining?: number;
    accountInfo?: any;
  } | null> {
    try {
      // Try to get account info which may contain subscription details
      const accountInfo = await this.getAccountInfo();
      
      if (accountInfo) {
        const result: any = {
          accountInfo,
        };

        // Check for common expiry fields
        if (accountInfo.expire_date || accountInfo.expiry_date || accountInfo.account_expire) {
          const expiryDate = accountInfo.expire_date || accountInfo.expiry_date || accountInfo.account_expire;
          result.expiryDate = expiryDate;
          
          // Calculate days remaining if we have a valid date
          if (expiryDate && expiryDate !== '0' && expiryDate !== 'unlimited') {
            try {
              const expiry = new Date(expiryDate);
              const now = new Date();
              const diffTime = expiry.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              result.daysRemaining = diffDays;
              result.status = diffDays > 0 ? 'active' : 'expired';
            } catch (e) {
              // Date parsing failed, just return what we have
            }
          } else if (expiryDate === 'unlimited') {
            result.status = 'unlimited';
          }
        }

        // Check for status field
        if (accountInfo.status) {
          result.status = accountInfo.status;
        }

        return result;
      }

      return null;
    } catch (error) {
      console.error('Get subscription info failed:', error);
      return null;
    }
  }

  async getGenres(): Promise<StalkerGenre[]> {
    try {
      const data = await this.makeRequest('itv', {
        action: 'get_genres',
        JsHttpRequest: '1-xml',
      });

      return data.js || [];
    } catch (error) {
      console.error('Get genres failed:', error);
      return [];
    }
  }

  async getChannels(genre?: string, page: number = 1): Promise<StalkerChannel[]> {
    try {
      const params: Record<string, any> = {
        action: 'get_ordered_list',
        type: 'itv',
        p: page,
        JsHttpRequest: '1-xml',
      };

      if (genre) {
        params.genre = genre;
      }

      const data = await this.makeRequest('itv', params);

      return data.js?.data || [];
    } catch (error) {
      console.error('Get channels failed:', error);
      return [];
    }
  }

  async getAllChannels(): Promise<StalkerChannel[]> {
    try {
      const data = await this.makeRequest('itv', {
        action: 'get_all_channels',
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || [];
    } catch (error) {
      console.error('Get all channels failed:', error);
      return [];
    }
  }

  async createLink(cmd: string, channelId: string): Promise<string | null> {
    try {
      const data = await this.makeRequest('itv', {
        action: 'create_link',
        cmd: encodeURIComponent(cmd),
        series: '',
        forced_storage: 'undefined',
        disable_ad: '0',
        download: '0',
        JsHttpRequest: '1-xml',
      });

      if (data.js?.cmd) {
        // Extract the actual stream URL from the cmd
        // The cmd format is typically: "ffmpeg http://..." or just "http://..."
        let streamUrl = data.js.cmd.trim();
        
        // If it starts with "ffmpeg ", extract everything after it
        if (streamUrl.toLowerCase().startsWith('ffmpeg ')) {
          streamUrl = streamUrl.substring(7).trim(); // Remove "ffmpeg " prefix
        }
        
        // Additional cleanup: remove any other command prefixes if present
        const urlMatch = streamUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          streamUrl = urlMatch[1];
        }
        
        return streamUrl;
      }

      return null;
    } catch (error) {
      console.error('Create link failed:', error);
      return null;
    }
  }

  async getEPG(channelId: string, period: number = 7): Promise<any[]> {
    try {
      const data = await this.makeRequest('itv', {
        action: 'get_epg_info',
        id: channelId,
        period,
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || [];
    } catch (error) {
      console.error('Get EPG failed:', error);
      return [];
    }
  }

  async getShortEPG(channelIds: string[]): Promise<Record<string, any>> {
    try {
      const data = await this.makeRequest('itv', {
        action: 'get_short_epg',
        ch_id: channelIds.join(','),
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || {};
    } catch (error) {
      console.error('Get short EPG failed:', error);
      return {};
    }
  }

  async getVODCategories(): Promise<StalkerGenre[]> {
    try {
      const data = await this.makeRequest('vod', {
        action: 'get_categories',
        JsHttpRequest: '1-xml',
      });

      return data.js || [];
    } catch (error) {
      console.error('Get VOD categories failed:', error);
      return [];
    }
  }

  async getMovies(category?: string, page: number = 1): Promise<StalkerMovie[]> {
    try {
      const params: Record<string, any> = {
        action: 'get_ordered_list',
        type: 'vod',
        p: page,
        JsHttpRequest: '1-xml',
      };

      if (category) {
        params.category = category;
      }

      const data = await this.makeRequest('vod', params);

      return data.js?.data || [];
    } catch (error) {
      console.error('Get movies failed:', error);
      return [];
    }
  }

  async getAllMovies(): Promise<StalkerMovie[]> {
    try {
      const data = await this.makeRequest('vod', {
        action: 'get_ordered_list',
        type: 'vod',
        p: 1,
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || [];
    } catch (error) {
      console.error('Get all movies failed:', error);
      return [];
    }
  }

  async getSeriesCategories(): Promise<StalkerGenre[]> {
    try {
      const data = await this.makeRequest('series', {
        action: 'get_categories',
        JsHttpRequest: '1-xml',
      });

      return data.js || [];
    } catch (error) {
      console.error('Get series categories failed:', error);
      return [];
    }
  }

  async getSeries(category?: string, page: number = 1): Promise<StalkerSeries[]> {
    try {
      const params: Record<string, any> = {
        action: 'get_ordered_list',
        type: 'series',
        p: page,
        JsHttpRequest: '1-xml',
      };

      if (category) {
        params.category = category;
      }

      const data = await this.makeRequest('series', params);

      return data.js?.data || [];
    } catch (error) {
      console.error('Get series failed:', error);
      return [];
    }
  }

  async getAllSeries(): Promise<StalkerSeries[]> {
    try {
      const data = await this.makeRequest('series', {
        action: 'get_ordered_list',
        type: 'series',
        p: 1,
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || [];
    } catch (error) {
      console.error('Get all series failed:', error);
      return [];
    }
  }

  async getSeriesSeasons(seriesId: string): Promise<any[]> {
    try {
      const data = await this.makeRequest('series', {
        action: 'get_ordered_list',
        movie_id: seriesId,
        season_id: 0,
        episode_id: 0,
        JsHttpRequest: '1-xml',
      });

      return data.js?.data || [];
    } catch (error) {
      console.error('Get series seasons failed:', error);
      return [];
    }
  }

  async createVODLink(cmd: string, movieId: string): Promise<string | null> {
    try {
      const data = await this.makeRequest('vod', {
        action: 'create_link',
        cmd: encodeURIComponent(cmd),
        series: '',
        forced_storage: 'undefined',
        disable_ad: '0',
        download: '0',
        JsHttpRequest: '1-xml',
      });

      if (data.js?.cmd) {
        // Extract the actual stream URL from the cmd
        // The cmd format is typically: "ffmpeg http://..." or just "http://..."
        let streamUrl = data.js.cmd.trim();
        
        // If it starts with "ffmpeg ", extract everything after it
        if (streamUrl.toLowerCase().startsWith('ffmpeg ')) {
          streamUrl = streamUrl.substring(7).trim(); // Remove "ffmpeg " prefix
        }
        
        // Additional cleanup: remove any other command prefixes if present
        const urlMatch = streamUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          streamUrl = urlMatch[1];
        }
        
        return streamUrl;
      }

      return null;
    } catch (error) {
      console.error('Create VOD link failed:', error);
      return null;
    }
  }

  async createSeriesLink(cmd: string, seriesId: string, seasonId?: string, episodeId?: string): Promise<string | null> {
    try {
      const params: Record<string, any> = {
        action: 'create_link',
        cmd: encodeURIComponent(cmd),
        forced_storage: 'undefined',
        disable_ad: '0',
        download: '0',
        JsHttpRequest: '1-xml',
      };

      if (seasonId) params.season = seasonId;
      if (episodeId) params.episode = episodeId;

      const data = await this.makeRequest('series', params);

      if (data.js?.cmd) {
        // Extract the actual stream URL from the cmd
        // The cmd format is typically: "ffmpeg http://..." or just "http://..."
        let streamUrl = data.js.cmd.trim();
        
        // If it starts with "ffmpeg ", extract everything after it
        if (streamUrl.toLowerCase().startsWith('ffmpeg ')) {
          streamUrl = streamUrl.substring(7).trim(); // Remove "ffmpeg " prefix
        }
        
        // Additional cleanup: remove any other command prefixes if present
        const urlMatch = streamUrl.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          streamUrl = urlMatch[1];
        }
        
        return streamUrl;
      }

      return null;
    } catch (error) {
      console.error('Create series link failed:', error);
      return null;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const handshakeSuccess = await this.handshake();
      if (!handshakeSuccess) return false;

      const profile = await this.getProfile();
      return !!profile;
    } catch (error) {
      return false;
    }
  }

  getToken(): string | undefined {
    return this.token;
  }

  getMacAddress(): string {
    return this.config.macAddress;
  }

  static generateMAC(prefix?: string): string {
    const hexDigits = '0123456789ABCDEF';
    let mac = prefix || '00:1A:79:'; // Common MAG prefix, can be customized

    // Ensure prefix ends with colon if it doesn't have all 6 octets
    if (!mac.endsWith(':') && mac.split(':').length < 6) {
      mac += ':';
    }

    const existingOctets = mac.split(':').filter(o => o.length > 0).length;
    const octetsNeeded = 6 - existingOctets;

    for (let i = 0; i < octetsNeeded; i++) {
      for (let j = 0; j < 2; j++) {
        mac += hexDigits.charAt(Math.floor(Math.random() * 16));
      }
      if (i < octetsNeeded - 1) mac += ':';
    }

    return mac;
  }

  static generateMultipleMACs(count: number = 5, prefix?: string): string[] {
    const macs: string[] = [];
    const commonPrefixes = [
      '00:1A:79:', // MAG200/250/254/256
      '00:1A:78:', // MAG alternative
      '00:50:C2:', // IEEE registered
      '00:E0:4C:', // Realtek
      '00:0D:97:', // Hitachi
    ];

    for (let i = 0; i < count; i++) {
      const selectedPrefix = prefix || commonPrefixes[i % commonPrefixes.length];
      macs.push(this.generateMAC(selectedPrefix));
    }

    return macs;
  }

  static async testMultipleMACs(
    portalUrl: string,
    macAddresses: string[],
    timezone?: string
  ): Promise<{
    workingMACs: Array<{ mac: string; profile?: any; subscription?: any }>;
    failedMACs: string[];
  }> {
    const workingMACs: Array<{ mac: string; profile?: any; subscription?: any }> = [];
    const failedMACs: string[] = [];

    for (const mac of macAddresses) {
      try {
        const api = new StalkerAPI({ portalUrl, macAddress: mac, timezone });
        const handshakeSuccess = await api.handshake();

        if (handshakeSuccess) {
          const profile = await api.getProfile();
          const subscription = await api.getSubscriptionInfo();
          
          workingMACs.push({
            mac,
            profile,
            subscription,
          });
        } else {
          failedMACs.push(mac);
        }
      } catch (error) {
        failedMACs.push(mac);
      }
    }

    return { workingMACs, failedMACs };
  }

  static validateMAC(mac: string): boolean {
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    return macRegex.test(mac);
  }

  static formatMAC(mac: string): string {
    // Remove all non-hex characters
    const cleaned = mac.replace(/[^0-9A-Fa-f]/g, '');
    
    // Format as XX:XX:XX:XX:XX:XX
    if (cleaned.length === 12) {
      return cleaned.match(/.{1,2}/g)?.join(':').toUpperCase() || mac;
    }
    
    return mac;
  }
}
