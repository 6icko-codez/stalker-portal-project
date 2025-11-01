import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { portalUrl, macAddress, token, categoryId } = await request.json()

    if (!portalUrl || !macAddress || !token || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'Portal URL, MAC Address, token, and category ID are required' },
        { status: 400 }
      )
    }

    // Get channels in category
    const categoryUrl = new URL(`${portalUrl}/portal.php`)
    categoryUrl.searchParams.set('type', 'itv')
    categoryUrl.searchParams.set('action', 'get_ordered_list')
    categoryUrl.searchParams.set('genre', categoryId.toString())
    categoryUrl.searchParams.set('JsHttpRequest', '1-xml')

    const categoryResponse = await fetch(categoryUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!categoryResponse.ok) {
      throw new Error(`Failed to get category: ${categoryResponse.statusText}`)
    }

    const categoryData = await categoryResponse.json()
    const channels = categoryData?.js?.data || []

    return NextResponse.json({
      success: true,
      channels: channels
    })

  } catch (error: any) {
    console.error('Get category error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get category' },
      { status: 500 }
    )
  }
}