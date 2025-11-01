'use client';

import React, { useState, useEffect } from 'react';
import { useIPTVStore } from '@/lib/stores/useIPTVStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Grid3x3,
  List,
  Star,
  Tv,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ChannelList() {
  const {
    channels,
    filteredChannels,
    currentChannel,
    activePortal,
    searchQuery,
    selectedCategory,
    setChannels,
    setCurrentChannel,
    setSearchQuery,
    setSelectedCategory,
    toggleFavorite,
  } = useIPTVStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (activePortal) {
      loadChannels();
    }
  }, [activePortal]);

  useEffect(() => {
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(channels.map((ch) => ch.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);
  }, [channels]);

  const loadChannels = async () => {
    if (!activePortal) {
      toast.error('No active portal');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/iptv/stalker/channels', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
      });

      if (response.data.success) {
        const channelData = response.data.channels.map((ch: any) => ({
          id: ch.id,
          portalId: activePortal.id,
          externalId: ch.id,
          name: ch.name,
          number: ch.number,
          logo: ch.logo,
          category: ch.tv_genre_id,
          streamUrl: null,
          epgId: ch.id,
          isHD: ch.name.toLowerCase().includes('hd'),
          isFavorite: false,
          cmd: ch.cmd,
        }));

        setChannels(channelData);
        toast.success(`Loaded ${channelData.length} channels`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load channels');
    } finally {
      setIsLoading(false);
    }
  };

  const playChannel = async (channel: any) => {
    if (!activePortal) return;

    try {
      // Get stream URL
      const response = await axios.post('/api/iptv/stalker/stream', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
        cmd: channel.cmd,
        channelId: channel.externalId,
      });

      if (response.data.success) {
        setCurrentChannel({
          ...channel,
          streamUrl: response.data.streamUrl,
        });
        toast.success(`Playing ${channel.name}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to play channel');
    }
  };

  const handleFavorite = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    toggleFavorite(channelId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadChannels}
            disabled={isLoading || !activePortal}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {selectedCategory || 'All Categories'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedCategory(null)}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Channel List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Loading channels...</p>
            </div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Tv className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {channels.length === 0
                  ? 'No channels loaded. Click refresh to load channels.'
                  : 'No channels found matching your search.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => playChannel(channel)}
                className={cn(
                  'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                  currentChannel?.id === channel.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tv className="w-8 h-8 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleFavorite(e, channel.id)}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        channel.isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>
                </div>
                <div className="p-2 bg-background">
                  <p className="font-medium text-sm truncate">{channel.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {channel.number && (
                      <Badge variant="secondary" className="text-xs">
                        {channel.number}
                      </Badge>
                    )}
                    {channel.isHD && (
                      <Badge variant="default" className="text-xs">
                        HD
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {filteredChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => playChannel(channel)}
                className={cn(
                  'flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                  currentChannel?.id === channel.id && 'bg-primary/10'
                )}
              >
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Tv className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{channel.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {channel.number && (
                      <Badge variant="secondary" className="text-xs">
                        {channel.number}
                      </Badge>
                    )}
                    {channel.isHD && (
                      <Badge variant="default" className="text-xs">
                        HD
                      </Badge>
                    )}
                    {channel.category && (
                      <span className="text-xs text-muted-foreground">
                        {channel.category}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleFavorite(e, channel.id)}
                >
                  <Star
                    className={cn(
                      'w-4 h-4',
                      channel.isFavorite && 'fill-yellow-400 text-yellow-400'
                    )}
                  />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
