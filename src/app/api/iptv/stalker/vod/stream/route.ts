import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone, cmd, contentId, contentType, seasonId, episodeId } = body;

    if (!portalUrl || !macAddress || !cmd || !contentId || !contentType) {
      return NextResponse.json(
        { error: 'Portal URL, MAC address, cmd, contentId, and contentType are required' },
        { status: 400 }
      );
    }

    const api = new StalkerAPI({ portalUrl, macAddress, timezone });
    
    // Authenticate first
    const handshakeSuccess = await api.handshake();
    if (!handshakeSuccess) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create stream link based on content type
    let streamUrl: string | null = null;

    if (contentType === 'movie') {
      streamUrl = await api.createVODLink(cmd, contentId);
    } else if (contentType === 'series') {
      streamUrl = await api.createSeriesLink(cmd, contentId, seasonId, episodeId);
    } else {
      return NextResponse.json(
        { error: 'Invalid content type. Must be "movie" or "series"' },
        { status: 400 }
      );
    }

    if (!streamUrl) {
      return NextResponse.json(
        { error: 'Failed to create stream link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
