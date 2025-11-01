import { NextResponse } from 'next/server';
import { StalkerAPI } from '@/lib/stalker-api';

export async function GET() {
  try {
    const macAddress = StalkerAPI.generateMAC();

    return NextResponse.json({
      success: true,
      macAddress,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
