import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { portalUrl, macAddress } = await request.json()

    if (!portalUrl || !macAddress) {
      return NextResponse.json(
        { success: false, error: 'Portal URL and MAC Address are required' },
        { status: 400 }
      )
    }

    // Perform handshake
    const handshakeUrl = new URL(`${portalUrl}/portal.php`)
    handshakeUrl.searchParams.set('type', 'stb')
    handshakeUrl.searchParams.set('action', 'handshake')
    handshakeUrl.searchParams.set('JsHttpRequest', '1-xml')

    const handshakeResponse = await fetch(handshakeUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London`
      }
    })

    if (!handshakeResponse.ok) {
      throw new Error(`Handshake failed: ${handshakeResponse.statusText}`)
    }

    const handshakeData = await handshakeResponse.json()
    const token = handshakeData?.js?.token

    if (!token) {
      throw new Error('No token received from handshake')
    }

    // Get profile
    const profileUrl = new URL(`${portalUrl}/portal.php`)
    profileUrl.searchParams.set('type', 'stb')
    profileUrl.searchParams.set('action', 'get_profile')
    profileUrl.searchParams.set('JsHttpRequest', '1-xml')

    const profileResponse = await fetch(profileUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!profileResponse.ok) {
      throw new Error(`Profile fetch failed: ${profileResponse.statusText}`)
    }

    const profileData = await profileResponse.json()
    const profile = profileData?.js

    return NextResponse.json({
      success: true,
      token: token,
      profile: profile
    })

  } catch (error: any) {
    console.error('Stalker connection error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Connection failed' },
      { status: 500 }
    )
  }
}