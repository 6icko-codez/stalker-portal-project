import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { portalUrl, macAddress, token } = await request.json()

    if (!portalUrl || !macAddress || !token) {
      return NextResponse.json(
        { success: false, error: 'Portal URL, MAC Address, and token are required' },
        { status: 400 }
      )
    }

    // Get genres/channels
    const genresUrl = new URL(`${portalUrl}/portal.php`)
    genresUrl.searchParams.set('type', 'itv')
    genresUrl.searchParams.set('action', 'get_genres')
    genresUrl.searchParams.set('JsHttpRequest', '1-xml')

    const genresResponse = await fetch(genresUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!genresResponse.ok) {
      throw new Error(`Failed to get genres: ${genresResponse.statusText}`)
    }

    const genresData = await genresResponse.json()
    const channels = genresData?.js || []

    return NextResponse.json({
      success: true,
      channels: channels
    })

  } catch (error: any) {
    console.error('Get channels error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get channels' },
      { status: 500 }
    )
  }
}