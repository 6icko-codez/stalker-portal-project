import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CacheManager } from '@/lib/cache-manager';

export interface Portal {
  id: string;
  name: string;
  url: string;
  macAddress: string;
  timezone: string;
  isActive: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
}

export interface Channel {
  id: string;
  portalId: string;
  externalId: string;
  name: string;
  number?: number;
  logo?: string;
  category?: string;
  streamUrl?: string;
  epgId?: string;
  isHD: boolean;
  isFavorite: boolean;
  cmd?: string;
}

export interface Movie {
  id: string;
  portalId: string;
  externalId: string;
  name: string;
  originalName?: string;
  description?: string;
  poster?: string;
  logo?: string;
  cmd: string;
  year?: string;
  director?: string;
  actors?: string;
  category?: string;
  ratingImdb?: string;
  ratingKinopoisk?: string;
  duration?: string;
  genres?: string[];
  streamUrl?: string;
  isFavorite: boolean;
}

export interface Series {
  id: string;
  portalId: string;
  externalId: string;
  name: string;
  originalName?: string;
  description?: string;
  poster?: string;
  logo?: string;
  cmd: string;
  year?: string;
  director?: string;
  actors?: string;
  category?: string;
  ratingImdb?: string;
  ratingKinopoisk?: string;
  genres?: string[];
  seasons?: any[];
  streamUrl?: string;
  isFavorite: boolean;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  epgId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  category?: string;
  rating?: string;
  poster?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isPiP: boolean;
  quality: 'auto' | '1080p' | '720p' | '480p' | '360p';
  playbackRate: number;
  subtitles: {
    enabled: boolean;
    language?: string;
    url?: string;
  };
}

interface IPTVStore {
  // Portal Management
  portals: Portal[];
  activePortal: Portal | null;
  setActivePortal: (portal: Portal | null) => void;
  addPortal: (portal: Portal) => void;
  updatePortal: (id: string, updates: Partial<Portal>) => void;
  removePortal: (id: string) => void;

  // Channel Management (Live TV)
  channels: Channel[];
  currentChannel: Channel | null;
  filteredChannels: Channel[];
  searchQuery: string;
  selectedCategory: string | null;
  isLoadingChannels: boolean;
  channelsError: string | null;
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleFavorite: (channelId: string) => void;
  setIsLoadingChannels: (loading: boolean) => void;
  setChannelsError: (error: string | null) => void;
  loadChannelsFromCache: () => boolean;
  saveChannelsToCache: (channels: Channel[]) => void;
  clearChannelsCache: () => void;

  // Movie Management
  movies: Movie[];
  currentMovie: Movie | null;
  filteredMovies: Movie[];
  movieSearchQuery: string;
  selectedMovieCategory: string | null;
  isLoadingMovies: boolean;
  moviesError: string | null;
  setMovies: (movies: Movie[]) => void;
  setCurrentMovie: (movie: Movie | null) => void;
  setMovieSearchQuery: (query: string) => void;
  setSelectedMovieCategory: (category: string | null) => void;
  toggleMovieFavorite: (movieId: string) => void;
  setIsLoadingMovies: (loading: boolean) => void;
  setMoviesError: (error: string | null) => void;
  loadMoviesFromCache: () => boolean;
  saveMoviesToCache: (movies: Movie[]) => void;

  // Series Management
  series: Series[];
  currentSeries: Series | null;
  filteredSeries: Series[];
  seriesSearchQuery: string;
  selectedSeriesCategory: string | null;
  isLoadingSeries: boolean;
  seriesError: string | null;
  setSeries: (series: Series[]) => void;
  setCurrentSeries: (series: Series | null) => void;
  setSeriesSearchQuery: (query: string) => void;
  setSelectedSeriesCategory: (category: string | null) => void;
  toggleSeriesFavorite: (seriesId: string) => void;
  setIsLoadingSeries: (loading: boolean) => void;
  setSeriesError: (error: string | null) => void;
  loadSeriesFromCache: () => boolean;
  saveSeriesToCache: (series: Series[]) => void;

  // EPG Management
  epgData: Map<string, EPGProgram[]>;
  setEPGData: (channelId: string, programs: EPGProgram[]) => void;
  getCurrentProgram: (channelId: string) => EPGProgram | null;

  // Player State
  playerState: PlayerState;
  updatePlayerState: (updates: Partial<PlayerState>) => void;

  // UI State
  sidebarOpen: boolean;
  epgPanelOpen: boolean;
  settingsOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setEPGPanelOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;

  // Scroll Position Management
  scrollPositions: Map<string, { channels: number; movies: number; series: number }>;
  setScrollPosition: (portalId: string, type: 'channels' | 'movies' | 'series', position: number) => void;
  getScrollPosition: (portalId: string, type: 'channels' | 'movies' | 'series') => number;

  // Settings
  settings: {
    autoPlay: boolean;
    rememberPosition: boolean;
    defaultQuality: 'auto' | '1080p' | '720p' | '480p' | '360p';
    subtitlesEnabled: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  updateSettings: (updates: Partial<IPTVStore['settings']>) => void;
}

export const useIPTVStore = create<IPTVStore>()(
  persist(
    (set, get) => ({
      // Portal Management
      portals: [],
      activePortal: null,
      setActivePortal: async (portal) => {
        const prevPortal = get().activePortal;
        
        // Clear cache when switching portals
        if (prevPortal && portal && prevPortal.id !== portal.id) {
          console.log('[Store] Switching portals, clearing cache');
          try {
            await CacheManager.clearPortal(prevPortal.id);
          } catch (error) {
            console.error('[Store] Failed to clear portal cache:', error);
          }
          set({ 
            channels: [], 
            filteredChannels: [],
            movies: [],
            filteredMovies: [],
            series: [],
            filteredSeries: [],
          });
        }
        
        set({ activePortal: portal });
      },
      addPortal: (portal) =>
        set((state) => ({ portals: [...state.portals, portal] })),
      updatePortal: (id, updates) =>
        set((state) => ({
          portals: state.portals.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          activePortal:
            state.activePortal?.id === id
              ? { ...state.activePortal, ...updates }
              : state.activePortal,
        })),
      removePortal: async (id) => {
        // Clear cache for removed portal
        try {
          await CacheManager.clearPortal(id);
        } catch (error) {
          console.error('[Store] Failed to clear portal cache:', error);
        }
        
        set((state) => ({
          portals: state.portals.filter((p) => p.id !== id),
          activePortal: state.activePortal?.id === id ? null : state.activePortal,
        }));
      },

      // Channel Management (Live TV)
      channels: [],
      currentChannel: null,
      filteredChannels: [],
      searchQuery: '',
      selectedCategory: null,
      isLoadingChannels: false,
      channelsError: null,
      setChannels: async (channels) => {
        set({ channels, filteredChannels: channels, channelsError: null });
        
        // Save to cache
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setChannels(activePortal.id, channels);
          } catch (error) {
            console.error('[Store] Failed to cache channels:', error);
          }
        }
      },
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
      setIsLoadingChannels: (loading) => set({ isLoadingChannels: loading }),
      setChannelsError: (error) => set({ channelsError: error }),
      loadChannelsFromCache: async () => {
        const { activePortal } = get();
        if (!activePortal) return false;

        try {
          const cachedChannels = await CacheManager.getChannels(activePortal.id);
          if (cachedChannels && cachedChannels.length > 0) {
            console.log(`[Store] Loaded ${cachedChannels.length} channels from cache`);
            set({ 
              channels: cachedChannels, 
              filteredChannels: cachedChannels,
              channelsError: null,
            });
            return true;
          }
        } catch (error) {
          console.error('[Store] Failed to load channels from cache:', error);
        }
        
        return false;
      },
      saveChannelsToCache: async (channels) => {
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setChannels(activePortal.id, channels);
          } catch (error) {
            console.error('[Store] Failed to save channels to cache:', error);
          }
        }
      },
      clearChannelsCache: async () => {
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.remove('iptv-channels', activePortal.id);
          } catch (error) {
            console.error('[Store] Failed to clear channels cache:', error);
          }
        }
      },
      setSearchQuery: (query) => {
        set({ searchQuery: query });
        const { channels, selectedCategory } = get();
        let filtered = channels;

        if (query) {
          filtered = filtered.filter((ch) =>
            ch.name.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (selectedCategory) {
          filtered = filtered.filter((ch) => ch.category === selectedCategory);
        }

        set({ filteredChannels: filtered });
      },
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
        const { channels, searchQuery } = get();
        let filtered = channels;

        if (category) {
          filtered = filtered.filter((ch) => ch.category === category);
        }

        if (searchQuery) {
          filtered = filtered.filter((ch) =>
            ch.name.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        set({ filteredChannels: filtered });
      },
      toggleFavorite: (channelId) =>
        set((state) => ({
          channels: state.channels.map((ch) =>
            ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
          ),
          filteredChannels: state.filteredChannels.map((ch) =>
            ch.id === channelId ? { ...ch, isFavorite: !ch.isFavorite } : ch
          ),
          currentChannel:
            state.currentChannel?.id === channelId
              ? { ...state.currentChannel, isFavorite: !state.currentChannel.isFavorite }
              : state.currentChannel,
        })),

      // Movie Management
      movies: [],
      currentMovie: null,
      filteredMovies: [],
      movieSearchQuery: '',
      selectedMovieCategory: null,
      isLoadingMovies: false,
      moviesError: null,
      setMovies: async (movies) => {
        set({ movies, filteredMovies: movies, moviesError: null });
        
        // Save to cache
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setMovies(activePortal.id, movies);
          } catch (error) {
            console.error('[Store] Failed to cache movies:', error);
          }
        }
      },
      setCurrentMovie: (movie) => set({ currentMovie: movie }),
      setIsLoadingMovies: (loading) => set({ isLoadingMovies: loading }),
      setMoviesError: (error) => set({ moviesError: error }),
      loadMoviesFromCache: async () => {
        const { activePortal } = get();
        if (!activePortal) return false;

        try {
          const cachedMovies = await CacheManager.getMovies(activePortal.id);
          if (cachedMovies && cachedMovies.length > 0) {
            console.log(`[Store] Loaded ${cachedMovies.length} movies from cache`);
            set({ 
              movies: cachedMovies, 
              filteredMovies: cachedMovies,
              moviesError: null,
            });
            return true;
          }
        } catch (error) {
          console.error('[Store] Failed to load movies from cache:', error);
        }
        
        return false;
      },
      saveMoviesToCache: async (movies) => {
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setMovies(activePortal.id, movies);
          } catch (error) {
            console.error('[Store] Failed to save movies to cache:', error);
          }
        }
      },
      setMovieSearchQuery: (query) => {
        set({ movieSearchQuery: query });
        const { movies, selectedMovieCategory } = get();
        let filtered = movies;

        if (query) {
          filtered = filtered.filter((m) =>
            m.name.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (selectedMovieCategory) {
          filtered = filtered.filter((m) => m.category === selectedMovieCategory);
        }

        set({ filteredMovies: filtered });
      },
      setSelectedMovieCategory: (category) => {
        set({ selectedMovieCategory: category });
        const { movies, movieSearchQuery } = get();
        let filtered = movies;

        if (category) {
          filtered = filtered.filter((m) => m.category === category);
        }

        if (movieSearchQuery) {
          filtered = filtered.filter((m) =>
            m.name.toLowerCase().includes(movieSearchQuery.toLowerCase())
          );
        }

        set({ filteredMovies: filtered });
      },
      toggleMovieFavorite: (movieId) =>
        set((state) => ({
          movies: state.movies.map((m) =>
            m.id === movieId ? { ...m, isFavorite: !m.isFavorite } : m
          ),
          filteredMovies: state.filteredMovies.map((m) =>
            m.id === movieId ? { ...m, isFavorite: !m.isFavorite } : m
          ),
          currentMovie:
            state.currentMovie?.id === movieId
              ? { ...state.currentMovie, isFavorite: !state.currentMovie.isFavorite }
              : state.currentMovie,
        })),

      // Series Management
      series: [],
      currentSeries: null,
      filteredSeries: [],
      seriesSearchQuery: '',
      selectedSeriesCategory: null,
      isLoadingSeries: false,
      seriesError: null,
      setSeries: async (series) => {
        set({ series, filteredSeries: series, seriesError: null });
        
        // Save to cache
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setSeries(activePortal.id, series);
          } catch (error) {
            console.error('[Store] Failed to cache series:', error);
          }
        }
      },
      setCurrentSeries: (series) => set({ currentSeries: series }),
      setIsLoadingSeries: (loading) => set({ isLoadingSeries: loading }),
      setSeriesError: (error) => set({ seriesError: error }),
      loadSeriesFromCache: async () => {
        const { activePortal } = get();
        if (!activePortal) return false;

        try {
          const cachedSeries = await CacheManager.getSeries(activePortal.id);
          if (cachedSeries && cachedSeries.length > 0) {
            console.log(`[Store] Loaded ${cachedSeries.length} series from cache`);
            set({ 
              series: cachedSeries, 
              filteredSeries: cachedSeries,
              seriesError: null,
            });
            return true;
          }
        } catch (error) {
          console.error('[Store] Failed to load series from cache:', error);
        }
        
        return false;
      },
      saveSeriesToCache: async (series) => {
        const { activePortal } = get();
        if (activePortal) {
          try {
            await CacheManager.setSeries(activePortal.id, series);
          } catch (error) {
            console.error('[Store] Failed to save series to cache:', error);
          }
        }
      },
      setSeriesSearchQuery: (query) => {
        set({ seriesSearchQuery: query });
        const { series, selectedSeriesCategory } = get();
        let filtered = series;

        if (query) {
          filtered = filtered.filter((s) =>
            s.name.toLowerCase().includes(query.toLowerCase())
          );
        }

        if (selectedSeriesCategory) {
          filtered = filtered.filter((s) => s.category === selectedSeriesCategory);
        }

        set({ filteredSeries: filtered });
      },
      setSelectedSeriesCategory: (category) => {
        set({ selectedSeriesCategory: category });
        const { series, seriesSearchQuery } = get();
        let filtered = series;

        if (category) {
          filtered = filtered.filter((s) => s.category === category);
        }

        if (seriesSearchQuery) {
          filtered = filtered.filter((s) =>
            s.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
          );
        }

        set({ filteredSeries: filtered });
      },
      toggleSeriesFavorite: (seriesId) =>
        set((state) => ({
          series: state.series.map((s) =>
            s.id === seriesId ? { ...s, isFavorite: !s.isFavorite } : s
          ),
          filteredSeries: state.filteredSeries.map((s) =>
            s.id === seriesId ? { ...s, isFavorite: !s.isFavorite } : s
          ),
          currentSeries:
            state.currentSeries?.id === seriesId
              ? { ...state.currentSeries, isFavorite: !state.currentSeries.isFavorite }
              : state.currentSeries,
        })),

      // EPG Management
      epgData: new Map(),
      setEPGData: (channelId, programs) =>
        set((state) => {
          const newEPGData = new Map(state.epgData);
          newEPGData.set(channelId, programs);
          return { epgData: newEPGData };
        }),
      getCurrentProgram: (channelId) => {
        const programs = get().epgData.get(channelId);
        if (!programs) return null;

        const now = new Date();
        return (
          programs.find(
            (p) => new Date(p.startTime) <= now && new Date(p.endTime) > now
          ) || null
        );
      },

      // Player State
      playerState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
        isMuted: false,
        isFullscreen: false,
        isPiP: false,
        quality: 'auto',
        playbackRate: 1,
        subtitles: {
          enabled: false,
        },
      },
      updatePlayerState: (updates) =>
        set((state) => ({
          playerState: { ...state.playerState, ...updates },
        })),

      // UI State
      sidebarOpen: true,
      epgPanelOpen: false,
      settingsOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setEPGPanelOpen: (open) => set({ epgPanelOpen: open }),
      setSettingsOpen: (open) => set({ settingsOpen: open }),

      // Scroll Position Management
      scrollPositions: new Map(),
      setScrollPosition: (portalId, type, position) => {
        set((state) => {
          const newScrollPositions = new Map(state.scrollPositions);
          const current = newScrollPositions.get(portalId) || { channels: 0, movies: 0, series: 0 };
          newScrollPositions.set(portalId, { ...current, [type]: position });
          return { scrollPositions: newScrollPositions };
        });
      },
      getScrollPosition: (portalId, type) => {
        const positions = get().scrollPositions.get(portalId);
        return positions?.[type] || 0;
      },

      // Settings
      settings: {
        autoPlay: true,
        rememberPosition: true,
        defaultQuality: 'auto',
        subtitlesEnabled: false,
        theme: 'dark',
      },
      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),
    }),
    {
      name: 'iptv-storage',
      partialize: (state) => ({
        portals: state.portals,
        activePortal: state.activePortal,
        settings: state.settings,
      }),
    }
  )
);
