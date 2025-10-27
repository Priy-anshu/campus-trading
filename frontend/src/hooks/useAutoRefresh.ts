import { useEffect, useRef } from 'react';

interface UseAutoRefreshOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onRefresh?: () => void;
}

export const useAutoRefresh = ({ 
  interval = 15000, // 15 seconds default
  enabled = true,
  onRefresh 
}: UseAutoRefreshOptions = {}) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || !onRefresh) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      onRefresh();
    }, interval);

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [interval, enabled, onRefresh]);

  // Manual refresh function
  const refresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return { refresh };
};
