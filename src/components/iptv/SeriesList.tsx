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
  Play,
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

export function SeriesList() {
  const {
    series,
    filteredSeries,
    currentSeries,
    activePortal,
    seriesSearchQuery,
    selectedSeriesCategory,
    setSeries,
    setCurrentSeries,
    setSeriesSearchQuery,
    setSelectedSeriesCategory,
    toggleSeriesFavorite,
    setCurrentChannel,
    setCurrentMovie,
  } = useIPTVStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (activePortal && series.length === 0) {
      loadSeries();
    }
  }, [activePortal]);

  useEffect(() => {
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(series.map((s) => s.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);
  }, [series]);

  const loadSeries = async () => {
    if (!activePortal) {
      toast.error('No active portal');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/iptv/stalker/vod/series', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
      });

      if (response.data.success) {
        const seriesData = response.data.series.map((s: any) => ({
          id: s.id,
          portalId: activePortal.id,
          externalId: s.id,
          name: s.name,
          originalName: s.o_name,
          description: s.description,
          poster: s.screenshot_uri || s.pic,
          logo: s.logo,
          cmd: s.cmd,
          year: s.year,
          director: s.director,
          actors: s.actors,
          category: s.category_id,
          ratingImdb: s.rating_imdb,
          ratingKinopoisk: s.rating_kinopoisk,
          genres: [s.genre_id_1, s.genre_id_2, s.genre_id_3, s.genre_id_4].filter(Boolean),
          seasons: s.series || [],
          streamUrl: null,
          isFavorite: false,
        }));

        setSeries(seriesData);
        toast.success(`Loaded ${seriesData.length} series`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load series');
    } finally {
      setIsLoading(false);
    }
  };

  const playSeries = async (seriesItem: any) => {
    if (!activePortal) return;

    try {
      // For now, play the first episode of the first season
      // In a full implementation, you'd show a season/episode selector
      const response = await axios.post('/api/iptv/stalker/vod/stream', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
        cmd: seriesItem.cmd,
        contentId: seriesItem.externalId,
        contentType: 'series',
      });

      if (response.data.success) {
        // Clear other content types
        setCurrentChannel(null);
        setCurrentMovie(null);
        
        setCurrentSeries({
          ...seriesItem,
          streamUrl: response.data.streamUrl,
        });
        toast.success(`Playing ${seriesItem.name}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to play series');
    }
  };

  const handleFavorite = (e: React.MouseEvent, seriesId: string) => {
    e.stopPropagation();
    toggleSeriesFavorite(seriesId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search series..."
              value={seriesSearchQuery}
              onChange={(e) => setSeriesSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadSeries}
            disabled={isLoading || !activePortal}
            className="border-white/10"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/10">
                <Filter className="w-4 h-4 mr-2" />
                {selectedSeriesCategory || 'All Categories'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedSeriesCategory(null)}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedSeriesCategory(category)}
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
            className={viewMode !== 'grid' ? 'border-white/10' : ''}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode !== 'list' ? 'border-white/10' : ''}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Series List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
              <p className="text-white/70">Loading series...</p>
            </div>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Tv className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">
                {series.length === 0
                  ? 'No series loaded. Click refresh to load series.'
                  : 'No series found matching your search.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {filteredSeries.map((seriesItem) => (
              <div
                key={seriesItem.id}
                onClick={() => playSeries(seriesItem)}
                className={cn(
                  'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                  currentSeries?.id === seriesItem.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                <div className="aspect-[2/3] bg-muted flex items-center justify-center relative">
                  {seriesItem.poster ? (
                    <img
                      src={seriesItem.poster}
                      alt={seriesItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Tv className="w-12 h-12 text-muted-foreground" />
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                    onClick={(e) => handleFavorite(e, seriesItem.id)}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        seriesItem.isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>

                  {seriesItem.year && (
                    <Badge className="absolute top-2 left-2 bg-black/70">
                      {seriesItem.year}
                    </Badge>
                  )}
                </div>
                <div className="p-2 bg-background/95 backdrop-blur">
                  <p className="font-medium text-sm truncate text-white">{seriesItem.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {seriesItem.ratingImdb && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {seriesItem.ratingImdb}
                      </Badge>
                    )}
                    {seriesItem.seasons && seriesItem.seasons.length > 0 && (
                      <Badge variant="outline" className="text-xs border-white/20">
                        {seriesItem.seasons.length} Seasons
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredSeries.map((seriesItem) => (
              <div
                key={seriesItem.id}
                onClick={() => playSeries(seriesItem)}
                className={cn(
                  'flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors',
                  currentSeries?.id === seriesItem.id && 'bg-primary/10'
                )}
              >
                <div className="w-20 h-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {seriesItem.poster ? (
                    <img
                      src={seriesItem.poster}
                      alt={seriesItem.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Tv className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{seriesItem.name}</p>
                  {seriesItem.originalName && seriesItem.originalName !== seriesItem.name && (
                    <p className="text-sm text-white/50 truncate">{seriesItem.originalName}</p>
                  )}
                  {seriesItem.description && (
                    <p className="text-sm text-white/70 line-clamp-2 mt-1">
                      {seriesItem.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {seriesItem.year && (
                      <Badge variant="secondary" className="text-xs">
                        {seriesItem.year}
                      </Badge>
                    )}
                    {seriesItem.ratingImdb && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {seriesItem.ratingImdb}
                      </Badge>
                    )}
                    {seriesItem.seasons && seriesItem.seasons.length > 0 && (
                      <Badge variant="outline" className="text-xs border-white/20">
                        {seriesItem.seasons.length} Seasons
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleFavorite(e, seriesItem.id)}
                >
                  <Star
                    className={cn(
                      'w-4 h-4',
                      seriesItem.isFavorite && 'fill-yellow-400 text-yellow-400'
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
