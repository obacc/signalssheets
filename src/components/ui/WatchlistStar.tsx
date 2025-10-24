import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface WatchlistStarProps {
  ticker: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const WatchlistStar: React.FC<WatchlistStarProps> = ({
  ticker,
  size = 'md',
  showLabel = false
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // Check if ticker is in watchlist on mount and when ticker changes
  useEffect(() => {
    const checkWatchlist = () => {
      const watchlist = localStorage.getItem('indicium_watchlist');
      if (watchlist) {
        try {
          const list: string[] = JSON.parse(watchlist);
          setIsInWatchlist(list.includes(ticker));
        } catch (error) {
          console.error('Failed to parse watchlist:', error);
        }
      }
    };

    checkWatchlist();

    // Listen for watchlist updates from other components
    const handleWatchlistUpdate = () => {
      checkWatchlist();
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
  }, [ticker]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click if in table
    e.preventDefault();

    const watchlist = localStorage.getItem('indicium_watchlist');
    let list: string[] = watchlist ? JSON.parse(watchlist) : [];

    if (list.includes(ticker)) {
      // Remove from watchlist
      list = list.filter(t => t !== ticker);
      setIsInWatchlist(false);
    } else {
      // Add to watchlist (limit to 50 signals)
      if (list.length < 50) {
        list.push(ticker);
        setIsInWatchlist(true);
      } else {
        alert('Has alcanzado el límite de 50 señales en la watchlist. Elimina algunas para agregar nuevas.');
        return;
      }
    }

    localStorage.setItem('indicium_watchlist', JSON.stringify(list));

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('watchlistUpdated'));
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      onClick={toggleWatchlist}
      className={`inline-flex items-center gap-2 p-2 rounded-lg transition-all ${
        isInWatchlist
          ? 'text-warning bg-warning/10 hover:bg-warning/20'
          : 'text-slate-400 hover:text-warning hover:bg-slate-100'
      }`}
      title={isInWatchlist ? 'Quitar de watchlist' : 'Agregar a watchlist'}
    >
      <Star
        className={`${sizeClasses[size]} ${isInWatchlist ? 'fill-current' : ''}`}
      />
      {showLabel && (
        <span className="text-sm font-medium">
          {isInWatchlist ? 'En Watchlist' : 'Agregar'}
        </span>
      )}
    </button>
  );
};

export default WatchlistStar;
