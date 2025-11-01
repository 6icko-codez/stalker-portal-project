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
        const streamUrl = data.js.cmd.split(' ')[0];
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

  static generateMAC(): string {
    const hexDigits = '0123456789ABCDEF';
    let mac = '00:1A:79:'; // Common MAG prefix

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        mac += hexDigits.charAt(Math.floor(Math.random() * 16));
      }
      if (i < 2) mac += ':';
    }

    return mac;
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
