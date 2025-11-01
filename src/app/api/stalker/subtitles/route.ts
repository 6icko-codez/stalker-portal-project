import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { portalUrl, macAddress, token, channelId } = await request.json()

    if (!portalUrl || !macAddress || !token || !channelId) {
      return NextResponse.json(
        { success: false, error: 'Portal URL, MAC Address, token, and channel ID are required' },
        { status: 400 }
      )
    }

    // Get subtitles for channel/VOD
    const subtitlesUrl = new URL(`${portalUrl}/portal.php`)
    subtitlesUrl.searchParams.set('type', 'itv')
    subtitlesUrl.searchParams.set('action', 'get_subtitles')
    subtitlesUrl.searchParams.set('id', channelId.toString())
    subtitlesUrl.searchParams.set('JsHttpRequest', '1-xml')

    const subtitlesResponse = await fetch(subtitlesUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!subtitlesResponse.ok) {
      throw new Error(`Failed to get subtitles: ${subtitlesResponse.statusText}`)
    }

    const subtitlesData = await subtitlesResponse.json()
    const subtitles = subtitlesData?.js

    return NextResponse.json({
      success: true,
      subtitles: subtitles
    })

  } catch (error: any) {
    console.error('Get subtitles error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get subtitles' },
      { status: 500 }
    )
  }
}