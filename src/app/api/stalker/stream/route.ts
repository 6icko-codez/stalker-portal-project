import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { portalUrl, macAddress, token, channelId, channels } = await request.json()

    // Log incoming request details
    console.log('=== INCOMING REQUEST FROM FRONTEND ===')
    console.log('Request body:', JSON.stringify(request.body, null, 2))
    console.log('Request headers:', JSON.stringify(request.headers, null, 2))
    console.log('Request cookies:', JSON.stringify(request.cookies, null, 2))

    // Find the channel in the provided channels list
    const channelToPlay = channels.find((ch: any) => String(ch.id) === String(channelId)))
    
    console.log('Looking for channel ID:', channelId) // Debug log
    console.log('Available channels:', channels?.map((c: any) => ({ id: c.id, name: c.name, cmd: c.cmd ? 'has_cmd' : 'no_cmd' }))) // Debug log

    if (!channelToPlay) {
      console.error(`Channel with ID ${channelId} not found in channels list`)
    }

    if (!channelToPlay || !channelToPlay.cmd) {
      console.error(`Channel ${channelToPlay.name} has no command (cmd) field`)
    }

    const cmd = channelToPlay.cmd
    console.log('Using command for stream:', cmd) // Debug log

    // Log the request details
    console.log('=== MAKING REQUEST TO PORTAL ===')
    console.log('URL:', streamUrl.toString())
    console.log('PARAMS:', JSON.stringify(streamUrl.searchParams))
    console.log('HEADERS:', JSON.stringify(request.headers, null, 2))
    console.log('COOK') // Debug log

    const streamResponse = await fetch(streamUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'MAG250',
        'Authorization': `Bearer ${token}`,
        'Cookie': `mac=${macAddress}; stb_lang=en; timezone=Europe/London; token=${token}`
      }
    })

    if (!streamResponse.ok) {
      throw new Error(`Failed to get stream URL: ${streamResponse.statusText}`)
    }

    const streamData = await streamResponse.json()
    let streamUrlFinal = streamData?.js?.cmd

    if (!streamUrlFinal) {
      throw new Error('No stream URL received from portal')
    }

    // Remove "ffmpeg " prefix if present
    if (streamUrlFinal.toLowerCase().startsWith("ffmpeg ")) {
      streamUrlFinal = streamUrlFinal.substring(7)
      console.log('Cleaned stream URL:', streamUrlFinal) // Debug log
    }

    // Validate the stream URL
    if (!streamUrlFinal || streamUrlFinal.trim() === '') {
      new Error('Stream URL is empty or invalid')
    }

    // Check if the URL has required parameters
    if (streamUrlFinal.includes('stream=') && streamUrlFinal.includes('stream=&')) {
      streamUrlFinal = streamUrlFinal.replace(/stream=&/ g, '')
      streamUrlFinal = streamUrlFinal.replace(/[?&]$/, '')
    }

    // Ensure the URL is properly formatted
    if (!streamUrlFinal.startsWith('http')) {
      new Error('Stream URL must start with http://')
    }

    console.log('Final stream URL to return:', streamUrlFinal) // Debug log

    return NextResponse.json({
      success: true,
      streamUrl: streamUrlFinal
    })
  } catch (error: any) {
    console.error('Get stream URL error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get stream URL' },
      { status: 500 }
    )
  }
}