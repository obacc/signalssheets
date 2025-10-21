import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WatchlistState {
  tickers: string[];
  addTicker: (ticker: string) => void;
  removeTicker: (ticker: string) => void;
  isFavorite: (ticker: string) => boolean;
  clearWatchlist: () => void;
  importWatchlist: (tickers: string[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      tickers: [],
      
      addTicker: (ticker: string) => {
        const normalized = ticker.toUpperCase().trim();
        set((state) => {
          if (state.tickers.includes(normalized)) return state;
          return { tickers: [...state.tickers, normalized] };
        });
      },
      
      removeTicker: (ticker: string) => {
        const normalized = ticker.toUpperCase().trim();
        set((state) => ({
          tickers: state.tickers.filter(t => t !== normalized)
        }));
      },
      
      isFavorite: (ticker: string) => {
        const normalized = ticker.toUpperCase().trim();
        return get().tickers.includes(normalized);
      },
      
      clearWatchlist: () => set({ tickers: [] }),
      
      importWatchlist: (tickers: string[]) => {
        const normalized = tickers.map(t => t.toUpperCase().trim());
        const unique = Array.from(new Set(normalized));
        set({ tickers: unique });
      }
    }),
    {
      name: 'watchlist-storage',
      version: 1,
    }
  )
);
