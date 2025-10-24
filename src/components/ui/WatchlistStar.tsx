import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface WatchlistStarProps {
  signalId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const WatchlistStar: React.FC<WatchlistStarProps> = ({
  signalId,
  size = 'md',
  showLabel = false
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  // DEBUG: Log component mount
  console.log('[WatchlistStar] Component mounted/updated with signalId:', signalId);

  // Check if signal is in watchlist on mount and when signalId changes
  useEffect(() => {
    console.log('[WatchlistStar] useEffect triggered for signalId:', signalId);

    const checkWatchlist = () => {
      const watchlist = localStorage.getItem('indicium_watchlist');
      console.log('[WatchlistStar] Current watchlist from localStorage:', watchlist);

      if (watchlist) {
        try {
          const list: string[] = JSON.parse(watchlist);
          const inList = list.includes(signalId);
          console.log('[WatchlistStar] Parsed list:', list);
          console.log('[WatchlistStar] Is', signalId, 'in watchlist?', inList);
          setIsInWatchlist(inList);
        } catch (error) {
          console.error('[WatchlistStar] Failed to parse watchlist:', error);
        }
      } else {
        console.log('[WatchlistStar] No watchlist found in localStorage');
      }
    };

    checkWatchlist();

    // Listen for watchlist updates from other components
    const handleWatchlistUpdate = () => {
      console.log('[WatchlistStar] Received watchlistUpdated event');
      checkWatchlist();
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => {
      console.log('[WatchlistStar] Cleaning up event listener for:', signalId);
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
    };
  }, [signalId]);

  const toggleWatchlist = (e: React.MouseEvent) => {
    console.log('[WatchlistStar] ========== TOGGLE CLICKED ==========');
    console.log('[WatchlistStar] signalId:', signalId);
    console.log('[WatchlistStar] Event target:', e.target);

    e.stopPropagation(); // Prevent row click if in table
    e.preventDefault();

    const watchlist = localStorage.getItem('indicium_watchlist');
    let list: string[] = watchlist ? JSON.parse(watchlist) : [];
    console.log('[WatchlistStar] Current list BEFORE toggle:', list);
    console.log('[WatchlistStar] Current isInWatchlist state:', isInWatchlist);

    if (list.includes(signalId)) {
      // Remove from watchlist
      console.log('[WatchlistStar] Removing', signalId, 'from watchlist');
      list = list.filter(id => id !== signalId);
      setIsInWatchlist(false);
    } else {
      // Add to watchlist (limit to 50 signals)
      if (list.length < 50) {
        console.log('[WatchlistStar] Adding', signalId, 'to watchlist');
        list.push(signalId);
        setIsInWatchlist(true);
      } else {
        console.log('[WatchlistStar] Watchlist full (50 signals)');
        alert('Has alcanzado el límite de 50 señales en la watchlist. Elimina algunas para agregar nuevas.');
        return;
      }
    }

    console.log('[WatchlistStar] New list AFTER toggle:', list);
    localStorage.setItem('indicium_watchlist', JSON.stringify(list));
    console.log('[WatchlistStar] Saved to localStorage');

    // Dispatch event for other components to listen
    window.dispatchEvent(new CustomEvent('watchlistUpdated'));
    console.log('[WatchlistStar] Dispatched watchlistUpdated event');
    console.log('[WatchlistStar] ========== TOGGLE COMPLETE ==========');
  };

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={toggleWatchlist}
      className={`inline-flex items-center gap-2 p-2 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-warning/50 ${
        isInWatchlist
          ? 'text-warning bg-warning/10 hover:bg-warning/20'
          : 'text-slate-400 hover:text-warning hover:bg-slate-100'
      }`}
      title={isInWatchlist ? 'Quitar de watchlist' : 'Agregar a watchlist'}
      aria-label={isInWatchlist ? 'Quitar de watchlist' : 'Agregar a watchlist'}
    >
      <Star
        className={`${sizeClasses[size]} transition-all ${isInWatchlist ? 'fill-current' : 'fill-none'}`}
        strokeWidth={2}
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
