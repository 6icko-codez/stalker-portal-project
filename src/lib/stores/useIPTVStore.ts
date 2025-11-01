import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channel: Channel | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  toggleFavorite: (channelId: string) => void;

  // Movie Management
  movies: Movie[];
  currentMovie: Movie | null;
  filteredMovies: Movie[];
  movieSearchQuery: string;
  selectedMovieCategory: string | null;
  setMovies: (movies: Movie[]) => void;
  setCurrentMovie: (movie: Movie | null) => void;
  setMovieSearchQuery: (query: string) => void;
  setSelectedMovieCategory: (category: string | null) => void;
  toggleMovieFavorite: (movieId: string) => void;

  // Series Management
  series: Series[];
  currentSeries: Series | null;
  filteredSeries: Series[];
  seriesSearchQuery: string;
  selectedSeriesCategory: string | null;
  setSeries: (series: Series[]) => void;
  setCurrentSeries: (series: Series | null) => void;
  setSeriesSearchQuery: (query: string) => void;
  setSelectedSeriesCategory: (category: string | null) => void;
  toggleSeriesFavorite: (seriesId: string) => void;

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
      setActivePortal: (portal) => set({ activePortal: portal }),
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
      removePortal: (id) =>
        set((state) => ({
          portals: state.portals.filter((p) => p.id !== id),
          activePortal: state.activePortal?.id === id ? null : state.activePortal,
        })),

      // Channel Management (Live TV)
      channels: [],
      currentChannel: null,
      filteredChannels: [],
      searchQuery: '',
      selectedCategory: null,
      setChannels: (channels) => {
        set({ channels, filteredChannels: channels });
      },
      setCurrentChannel: (channel) => set({ currentChannel: channel }),
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
      setMovies: (movies) => {
        set({ movies, filteredMovies: movies });
      },
      setCurrentMovie: (movie) => set({ currentMovie: movie }),
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
      setSeries: (series) => {
        set({ series, filteredSeries: series });
      },
      setCurrentSeries: (series) => set({ currentSeries: series }),
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
