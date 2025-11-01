import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      )
    }

    // Initialize ZAI SDK
    const zai = await ZAI.create()

    // Perform web search
    const searchResult = await zai.functions.invoke("web_search", {
      query: query,
      num: 10 // Return top 10 results
    })

    // Format the results
    const formattedResults = searchResult.map((item: any) => ({
      url: item.url,
      name: item.name,
      snippet: item.snippet,
      host_name: item.host_name,
      rank: item.rank,
      date: item.date,
      favicon: item.favicon
    }))

    return NextResponse.json({
      success: true,
      results: formattedResults,
      query: query,
      total: formattedResults.length
    })

  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    )
  }
}