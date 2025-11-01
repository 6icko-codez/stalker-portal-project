'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, Tv, Wifi, Settings, ArrowLeft, List, Loader2, AlertCircle, CheckCircle, Calendar, Subtitles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Channel {
  id: string | number
  name: string
  cmd?: string
  logo?: string
  description?: string
}

interface PortalConnection {
  portalUrl: string
  macAddress: string
  token?: string
  authenticated: boolean
  profile?: any
}

export default function IPTVStreamPlayer() {
  const [activeTab, setActiveTab] = useState('simple')
  const [simpleStreamUrl, setSimpleStreamUrl] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<string>('')
  const [videoError, setVideoError] = ''
  
  // Stalker Portal states
  const [portalConnection, setPortalConnection] = useState<PortalConnection>({
    portalUrl: '',
    macAddress: '',
    authenticated: false
    profile: {}
  })
  const [channels, setChannels] = useState<Channel[]>([])
  const [currentChannels, setCurrentChannels] = useState<Channel[]>([])
  const [navigationStack, setNavigationStack] = useState<Channel[][]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle' | 'connecting' | 'connected')
  const [statusMessage, setStatusMessage] = useState('')
  const [autoSwitchTab, setAutoSwitchTab] = useState(true) // New state for auto-switching
  const [currentStreamUrl, setCurrentStreamUrl] = useState('') // Debug: track current URL
  const [epgData, setEpgData] = useState<any>(null) // EPG data
  const [subtitlesData, setSubtitlesData] = useState<any>(null) // Subtitles data
  const [showEpg, setShowEpg] = useState(false) // Show EPG modal
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false) // Subtitles toggle
  const [hlsInstance, setHlsInstance] = useState<any>(null) // HLS.js instance
  const videoRef = useRef<HTMLVideoElement>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('iptv-player-settings')
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        setAutoSwitchTab(settings.autoSwitchTab ?? true)
        if (settings.portalUrl) {
          setPortalConnection(prev => ({ ...prev, portalUrl: settings.portalUrl }))
        }
        if (settings.macAddress) {
          setPortalConnection(prev => ({ ...prev, macAddress: settings.macAddress }))
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      autoSwitchTab,
      portalUrl: portalConnection.portalUrl,
      macAddress: portalConnection.macAddress
    }
    localStorage.setItem('iptv-player-settings', JSON.stringify(settings))
  }, [autoSwitchTab, portalConnection.portalUrl, portalConnection.macAddress])

  // Handle video URL changes
  useEffect(() => {
    if (videoRef.current && simpleStreamUrl && activeTab === 'simple' && isPlaying) {
      videoRef.current.src = simpleStreamUrl
    }
  }, [simpleStreamUrl, activeTab, isPlaying])

  // Load HLS.js dynamically
  const loadHlsJs = async () => {
    if (typeof window !== 'undefined' && !window.Hls) {
      try {
        const Hls = (await import('hls.js')).default
        window.Hls = Hls
        return Hls
      } catch (error) {
        console.error('Failed to load HLS.js:', error)
        return null
      }
    }
    return window.Hls
  }

  // Initialize HLS.js if needed
  const initializeHls = async () => {
    const Hls = await loadHlsJs()
    if (!Hls || !Hls.isSupported()) {
      console.warn('HLS.js is not supported in this browser')
      return null
    }

    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS.js error:', event, data)
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.error('Fatal network error, trying to recover...')
            hls.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.error('Fatal media error, trying to recover...')
            hls.recoverMediaError()
            break
          default:
            console.error('Fatal error, cannot recover')
            break
        }
      }
    })

    return hls
  }

  // Cleanup HLS.js on unmount
  useEffect(() => {
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy()
        setHlsInstance(null)
      }
    }
  }, [hlsInstance])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white text-white">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-950 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-grid-pattern animate-pulse"></div>
        </div>
      </div>

      {/* Particle Effects Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {particles.map(particle => (
          <div
            key={article.id}
            className="absolute particle-effect"
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              color: particle.color,
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Tv className="h-6 w-6" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-pink-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  CYBER<span className="text-pink-500">SEARCH</span>
                </h1>
                <p className="text-sm text-gray-400">Local Web App - Works Offline</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Wifi className="h-3 w-3 mr-1" />
                Local Mode
              </Badge>
              {currentChannel && (
                <Badge variant="outline" className="border-green-500 text-green-400">
                  <Wifi className="h-3 w-3 mr-1" />
                  {currentChannel}
                </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Auto-switch tab:</span>
                <Button
                  onClick={() => setAutoSwitchTab(!autoSwitchTab)}
                  variant="ghost"
                  size="sm"
                  className={`p-1 h-6 w-6 ${autoSwitchTab ? 'text-green-400' : 'text-gray-400'}`}
                >
                  {autoSwitchTab ? '✓' : '○'}
                </Button>
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Video Player Section */}
            <div className="space-y-4">
              <Card className="bg-black/50 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tv className="h-5 w-5" />
                    Video Player
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full"
                      controls
                      onError={(e) => setVideoError('Video playback failed')}
                    />
                    {!isPlaying && !currentChannel && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <div className="text-center">
                        <Tv className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">Select a channel to start watching</p>
                      </div>
                    </div>
                  </div>

                  {videoError && (
                    <Alert className="mt-4 border-red-500 bg-red-500/10">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{videoError}</AlertDescription>
                    </Alert>
                  )}

                  {statusMessage && (
                    <Alert className={`mt-4 ${
                      connectionStatus === 'connected' 
                        ? 'border-green-500 bg-green-500/10' 
                        : connectionStatus === 'error'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-blue-500 bg-blue-500/10'
                      }`}>
                      {connectionStatus === 'connected' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : connectionStatus === 'error' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 mt-4">
                    {isPlaying ? (
                      <Button onClick={stopPlayback} variant="destructive" size="sm">
                        <Square className="h-4 w-4 mr-2" />
                        Stop
                      </Button>
                    ) : (
                      <Button onClick={playSimpleStream} variant="default" size="sm" disabled={!simpleStreamUrl.trim() || isPlaying}>
                        <Play className="h-4 w-4 mr-2" />
                        Play Stream
                      </Button>
                    )}
                  </div>

                  {/* Debug Info - Show current stream URL */}
                  {currentStreamUrl && (
                    <div className="mt-4 p-3 bg-black/50 rounded border border-purple-500/30">
                      <p className="text-xs text-gray-400 mb-1">Current Stream URL:</p>
                      <p className="text-xs text-cyan-400 break-all font-mono">{currentStreamUrl}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400">Type:</span>
                        {currentStreamUrl.includes('.m3u8') && (
                          <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">HLS</Badge>
                        )}
                        {currentStreamUrl.includes('.ts') && (
                          <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">TS</Badge>
                        )}
                        {currentStreamUrl.includes('.mp4') && (
                          <Badge variant="outline" className="border-green-500 text-green-400 text-xs">MP4</Badge>
                        )}
                        {currentStreamUrl.includes('.avi') && (
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">MOV</Badge>
                        )}
                        {currentStreamUrl.includes('.flv') && (
                          <Badge variant="outline" className="border-pink-500 text-pink-400 text-xs">FLV</Badge>
                        )}
                        {currentStreamUrl.includes('.webm') && (
                          <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">WebM</Badge>
                        )}
                        {hlsInstance && (
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">HLS.js</Badge>
                        )}
                      {currentStreamUrl.includes('.mkv') && (
                        <Badge variant="outline" className="border-red-500 text-red-400 text-xs">MKV</Badge>
                      )}
                      {currentStreamUrl.includes('.avi') && (
                        <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">MOV</Badge>
                      )}
                      {currentStreamUrl.includes('.flv') && (
                        <Badge variant="outline" className="border-pink-500 text-pink-400 text-xs">FLV</Badge>
                      )}
                      {currentStreamUrl.includes('.webm') && (
                        <Badge variant="outline" className="border-cyan-500 text-cyan-400 text-xs">WebM</Badge>
                      )}
                      {hlsInstance && (
                        <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">HLS.js</Badge>
                      )}
                    </div>
                    
                    {/* Format compatibility info */}
                    {(currentStreamUrl.includes('.mkv') || currentStreamUrl.includes('.avi') || currentStreamUrl.includes('.mov') || currentStreamUrl.includes('.flv')) && (
                      <div className="p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
                        <p className="text-xs text-yellow-400">
                          ⚠️ This format may not work in all browsers. Try Chrome/Edge for best compatibility.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="simple" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Simple Stream
                </TabsTrigger>
                <TabsTrigger value="stalker" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Stalker Portal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="simple" className="space-y-4">
                <Card className="bg-black/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle>Direct Stream URL</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Stream URL</label>
                      <Input
                        value={simpleStreamUrl}
                        onChange={(e) => setSimpleStreamUrl(e.target.value)}
                        placeholder="https://example.com/stream.m3u8"
                        className="bg-black/30 border-purple-500/30"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Test URL: https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
                      </p>
                    </div>
                    <Button 
                      onClick={playSimpleStream} 
                      className="w-full"
                      disabled={!simpleStreamUrl.trim() || isPlaying}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Play Stream
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stalker" className="space-y-4">
                <Card className="bg-black/50 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Channels</span>
                      {navigationStack.length > 0 && (
                        <Button onClick={goBack} variant="outline" size="sm">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {currentChannels.map((channel) => (
                          <div
                            key={channel.id}
                            onClick={() => handleChannelClick(channel)}
                            className="p-3 rounded-lg bg-black/30 border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/10 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
                                {channel.cmd ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <List className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <div>
                                  <p className="font-medium text-cyan-300">{channel.name}</p>
                                  <p className="text-xs text-gray-400">
                                    {channel.cmd ? 'Channel' : 'Category'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {channel.cmd && (
                                <Badge variant="outline" className="border-green-500 text-green-400 text-xs">Play</Badge>
                              )}
                              {channel.cmd && (
                                <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">Play</Badge>
                              )}
                              {channel.cmd && (
                                <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">Play</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </Tabs>
          </div>

        {/* EPG Modal */}
        {showEpg && epgData && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEpg(false)}
          >
            <Card 
              className="bg-black/90 border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card 
                className="bg-black/90 border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Electronic Program Guide
                    </CardTitle>
                    <Button 
                      onClick={() => setShowEpg(false)} 
                      variant="ghost" 
                      size="sm"
                      className="p-1 h-6 w-6 text-gray-400 hover:text-white hover:text-white hover:text-black hover:bg-gray-700"
                    >
                      ✕
                    </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {epgData && epgData.length > 0 ? (
                    <div className="space-y-4">
                      {epgData.map((program: any, index: number) => (
                        <div key={index} className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-purple-300">{program.title || program.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{program.description || program.desc || 'No description'}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-400">
                                {program.start_time && new Date(program.start_time * 1000).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">→</span>
                              <span className="text-xs text-purple-400">{program.end_time && new Date(program.end_time * 1000).toLocaleString()}</span>
                            </div>
                            {program.genre && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">{program.genre}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Subtitles Status */}
        {subtitlesEnabled && subtitlesData && (
          <div className="fixed bottom-4 right-4 bg-black/90 border border-green-500/30 rounded-lg p-3 z-40">
            <div className="flex items-center gap-2">
              <Subtitles className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">Subtitles Enabled</span>
              <Button
                onClick={() => setSubtitlesEnabled(false)}
                variant="ghost"
                size="sm"
                className="p-1 h-4 w-4 text-gray-400 hover:text-white hover:text-black hover:bg-gray-700"
              >
                ×
              </Button>
            </div>
          </div>
        )}

        {/* EPG Modal */}
        {showEpg && epgData && (
          <div 
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowEpg(false)}
          >
            <Card 
              className="bg-black/90 border-purple-500/30 max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Electronic Program Guide
                  </CardTitle>
                  <Button 
                    onClick={() => setShowEpg(false)} 
                    variant="ghost" 
                    size="sm"
                    className="p-1 h-6 text-gray-400 hover:text-white hover:text-black hover:bg-gray-700"
                  >
                    ✕�
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {epgData && epgData.length > 0 ? (
                    <div className="space-y-4">
                      {epgData.map((program: any, index: number) => (
                        <div key={index} className="p-3 bg-purple-500/10 rounded border border-purple-500/20">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-purple-300">{program.title || program.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{program.description || program.desc || 'No description'}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-400">
                                {program.start_time && new Date(program.start_time * 1000).toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">→</span>
                              <span className="text-xs text-purple-400">{program.end_time && new Date(program.end_time * 1000).toLocaleString()}</span>
                            </div>
                            {program.genre && (
                              <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">{program.genre}</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Subtitles Status */}
        {subtitlesEnabled && subtitlesData && (
          <div className="fixed bottom-4 right-4 bg-black/90 border-green-500/30 rounded-lg p-3 z-40">
            <div className="flex items-center gap-2">
              <Subtitles className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">Subtitles Enabled</span>
              <Button
                onClick={() => setSubtitlesEnabled(false)}
                variant="ghost"
                size="sm"
                className="p-1 h-4 w-4 text-gray-400 hover:text-white hover:text-black hover:bg-gray-700"
              >
                ×
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}