'use client';

import React, { useState } from 'react';
import { VideoPlayer } from '@/components/iptv/VideoPlayer';
import { ChannelList } from '@/components/iptv/ChannelList';
import { EPGViewer } from '@/components/iptv/EPGViewer';
import { PortalManager } from '@/components/iptv/PortalManager';
import { useIPTVStore } from '@/lib/stores/useIPTVStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tv,
  Settings,
  Calendar,
  Menu,
  X,
  Star,
  Clock,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function IPTVPlayer() {
  const {
    currentChannel,
    sidebarOpen,
    epgPanelOpen,
    setSidebarOpen,
    setEPGPanelOpen,
    activePortal,
  } = useIPTVStore();

  const [activeTab, setActiveTab] = useState<'channels' | 'portals'>('channels');

  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(236,72,153,0.1),transparent_50%)]" />
      </div>

      {/* Main Layout */}
      <div className="relative h-full flex flex-col">
        {/* Header */}
        <header className="relative z-20 px-6 py-4 backdrop-blur-xl bg-black/20 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Tv className="w-6 h-6" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    IPTV Player Pro
                  </h1>
                  <p className="text-xs text-white/50">
                    {activePortal ? activePortal.name : 'No portal connected'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {currentChannel && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10 border border-white/20"
                >
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">{currentChannel.name}</span>
                </motion.div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEPGPanelOpen(!epgPanelOpen)}
                className={cn(
                  'rounded-full text-white hover:bg-white/10',
                  epgPanelOpen && 'bg-white/20'
                )}
              >
                <Calendar className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="relative flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <AnimatePresence>
            {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className={cn(
                  'absolute lg:relative z-10 w-80 h-full backdrop-blur-xl bg-black/40 border-r border-white/10',
                  'lg:block'
                )}
              >
                <div className="h-full flex flex-col">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as any)}
                    className="flex-1 flex flex-col"
                  >
                    <TabsList className="w-full grid grid-cols-2 bg-white/5 p-1 m-4 rounded-2xl">
                      <TabsTrigger
                        value="channels"
                        className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                      >
                        <Tv className="w-4 h-4 mr-2" />
                        Channels
                      </TabsTrigger>
                      <TabsTrigger
                        value="portals"
                        className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Portals
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="channels" className="flex-1 m-0">
                      <ChannelList />
                    </TabsContent>

                    <TabsContent value="portals" className="flex-1 m-0 p-4 overflow-auto">
                      <PortalManager />
                    </TabsContent>
                  </Tabs>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Main Player Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-6">
              <div className="h-full rounded-3xl overflow-hidden backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl">
                <VideoPlayer
                  streamUrl={currentChannel?.streamUrl}
                  poster={currentChannel?.logo}
                  className="h-full"
                />
              </div>
            </div>

            {/* Bottom Info Bar */}
            {currentChannel && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="px-6 pb-6"
              >
                <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 p-4">
                  <div className="flex items-center gap-4">
                    {currentChannel.logo && (
                      <img
                        src={currentChannel.logo}
                        alt={currentChannel.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{currentChannel.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {currentChannel.number && (
                          <span className="text-sm text-white/60">
                            Channel {currentChannel.number}
                          </span>
                        )}
                        {currentChannel.category && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="text-sm text-white/60">
                              {currentChannel.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-white hover:bg-white/10"
                    >
                      <Star
                        className={cn(
                          'w-5 h-5',
                          currentChannel.isFavorite && 'fill-yellow-400 text-yellow-400'
                        )}
                      />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </main>

          {/* EPG Panel */}
          <AnimatePresence>
            {epgPanelOpen && (
              <motion.div
                initial={{ x: 320 }}
                animate={{ x: 0 }}
                exit={{ x: 320 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 z-10 backdrop-blur-xl bg-black/40"
              >
                <EPGViewer />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Glassmorphism Overlay for Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 1024 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9] lg:hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
