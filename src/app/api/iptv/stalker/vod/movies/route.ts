import { NextRequest, NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portalUrl, macAddress, timezone, category, page } = body;

    if (!portalUrl || !macAddress) {
      return NextResponse.json(
        { error: 'Portal URL and MAC address are required' },
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

    // Get movies
    const movies = await api.getAllMovies();

    return NextResponse.json({
      success: true,
      movies,
      total: movies.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
