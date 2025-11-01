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
  Film,
  RefreshCw,
  Filter,
  Play,
  Clock,
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

export function MovieList() {
  const {
    movies,
    filteredMovies,
    currentMovie,
    activePortal,
    movieSearchQuery,
    selectedMovieCategory,
    setMovies,
    setCurrentMovie,
    setMovieSearchQuery,
    setSelectedMovieCategory,
    toggleMovieFavorite,
    setCurrentChannel,
    setCurrentSeries,
  } = useIPTVStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (activePortal && movies.length === 0) {
      loadMovies();
    }
  }, [activePortal]);

  useEffect(() => {
    // Extract unique categories
    const uniqueCategories = Array.from(
      new Set(movies.map((m) => m.category).filter(Boolean))
    ) as string[];
    setCategories(uniqueCategories);
  }, [movies]);

  const loadMovies = async () => {
    if (!activePortal) {
      toast.error('No active portal');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/iptv/stalker/vod/movies', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
      });

      if (response.data.success) {
        const movieData = response.data.movies.map((m: any) => ({
          id: m.id,
          portalId: activePortal.id,
          externalId: m.id,
          name: m.name,
          originalName: m.o_name,
          description: m.description,
          poster: m.screenshot_uri || m.pic,
          logo: m.logo,
          cmd: m.cmd,
          year: m.year,
          director: m.director,
          actors: m.actors,
          category: m.category_id,
          ratingImdb: m.rating_imdb,
          ratingKinopoisk: m.rating_kinopoisk,
          duration: m.duration,
          genres: [m.genre_id_1, m.genre_id_2, m.genre_id_3, m.genre_id_4].filter(Boolean),
          streamUrl: null,
          isFavorite: false,
        }));

        setMovies(movieData);
        toast.success(`Loaded ${movieData.length} movies`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to load movies');
    } finally {
      setIsLoading(false);
    }
  };

  const playMovie = async (movie: any) => {
    if (!activePortal) return;

    try {
      // Get stream URL
      const response = await axios.post('/api/iptv/stalker/vod/stream', {
        portalUrl: activePortal.url,
        macAddress: activePortal.macAddress,
        timezone: activePortal.timezone,
        cmd: movie.cmd,
        contentId: movie.externalId,
        contentType: 'movie',
      });

      if (response.data.success) {
        // Clear other content types
        setCurrentChannel(null);
        setCurrentSeries(null);
        
        setCurrentMovie({
          ...movie,
          streamUrl: response.data.streamUrl,
        });
        toast.success(`Playing ${movie.name}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to play movie');
    }
  };

  const handleFavorite = (e: React.MouseEvent, movieId: string) => {
    e.stopPropagation();
    toggleMovieFavorite(movieId);
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return null;
    const mins = parseInt(duration);
    if (isNaN(mins)) return null;
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search movies..."
              value={movieSearchQuery}
              onChange={(e) => setMovieSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={loadMovies}
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
                {selectedMovieCategory || 'All Categories'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedMovieCategory(null)}>
                All Categories
              </DropdownMenuItem>
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedMovieCategory(category)}
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

      {/* Movie List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
              <p className="text-white/70">Loading movies...</p>
            </div>
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Film className="w-12 h-12 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">
                {movies.length === 0
                  ? 'No movies loaded. Click refresh to load movies.'
                  : 'No movies found matching your search.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => playMovie(movie)}
                className={cn(
                  'relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105',
                  currentMovie?.id === movie.id
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-transparent hover:border-primary/50'
                )}
              >
                <div className="aspect-[2/3] bg-muted flex items-center justify-center relative">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Film className="w-12 h-12 text-muted-foreground" />
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12 text-white" />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                    onClick={(e) => handleFavorite(e, movie.id)}
                  >
                    <Star
                      className={cn(
                        'w-4 h-4',
                        movie.isFavorite && 'fill-yellow-400 text-yellow-400'
                      )}
                    />
                  </Button>

                  {movie.year && (
                    <Badge className="absolute top-2 left-2 bg-black/70">
                      {movie.year}
                    </Badge>
                  )}
                </div>
                <div className="p-2 bg-background/95 backdrop-blur">
                  <p className="font-medium text-sm truncate text-white">{movie.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {movie.ratingImdb && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {movie.ratingImdb}
                      </Badge>
                    )}
                    {movie.duration && (
                      <Badge variant="outline" className="text-xs border-white/20">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(movie.duration)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filteredMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => playMovie(movie)}
                className={cn(
                  'flex items-center gap-4 p-4 cursor-pointer hover:bg-white/5 transition-colors',
                  currentMovie?.id === movie.id && 'bg-primary/10'
                )}
              >
                <div className="w-20 h-28 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Film className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-white">{movie.name}</p>
                  {movie.originalName && movie.originalName !== movie.name && (
                    <p className="text-sm text-white/50 truncate">{movie.originalName}</p>
                  )}
                  {movie.description && (
                    <p className="text-sm text-white/70 line-clamp-2 mt-1">
                      {movie.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {movie.year && (
                      <Badge variant="secondary" className="text-xs">
                        {movie.year}
                      </Badge>
                    )}
                    {movie.ratingImdb && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {movie.ratingImdb}
                      </Badge>
                    )}
                    {movie.duration && (
                      <Badge variant="outline" className="text-xs border-white/20">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(movie.duration)}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleFavorite(e, movie.id)}
                >
                  <Star
                    className={cn(
                      'w-4 h-4',
                      movie.isFavorite && 'fill-yellow-400 text-yellow-400'
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
