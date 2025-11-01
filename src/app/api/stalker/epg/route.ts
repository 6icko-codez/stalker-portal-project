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

    // Get EPG for channel
    const epgUrl = new URL(`${portalUrl}/portal.php`)
    epgUrl.searchParams.set('type', 'itv')
    epgUrl.searchParams.set('action', 'get_epg_info')
    epgUrl.searchParams.set('id', channelId.toString())
    epgUrl.searchParams.set('JsHttpRequest', '1-xml')

    const epgResponse = await fetch(epgUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!epgResponse.ok) {
      throw new Error(`Failed to get EPG: ${epgResponse.statusText}`)
    }

    const epgData = await epgResponse.json()
    const epg = epgData?.js

    return NextResponse.json({
      success: true,
      epg: epg
    })

  } catch (error: any) {
    console.error('Get EPG error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get EPG' },
      { status: 500 }
    )
  }
}