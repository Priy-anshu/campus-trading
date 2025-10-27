import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface StockData {
  symbol: string;
  name?: string;
  lastPrice: number;
  change: number;
  pChange: number;
}

const MarketTicker = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);
  const animationParamsRef = useRef<{duration: number; distance: number}>({duration: 60000, distance: 5000});
  const pauseOffsetRef = useRef(0); // Track position when paused
  const pauseStartTimeRef = useRef(0); // Track when pause started
  const isPausedRef = useRef(false); // Use ref for pause state

  // Function to get or create persistent animation start time
  const getAnimationStartTime = () => {
    const storageKey = 'marketTickerStartTime';
    const sessionKey = 'marketTickerSessionTime';
    
    // Check if we have a global start time (survives HMR)
    if ((window as any).__marketTickerStartTime) {
      return (window as any).__marketTickerStartTime;
    }
    
    // First check sessionStorage (survives HMR but not full page refresh)
    const sessionStored = sessionStorage.getItem(sessionKey);
    if (sessionStored) {
      const startTime = parseInt(sessionStored);
      (window as any).__marketTickerStartTime = startTime;
      return startTime;
    }
    
    // Then check localStorage (survives full page refresh)
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const startTime = parseInt(stored);
      // Store in sessionStorage and global for HMR resilience
      sessionStorage.setItem(sessionKey, startTime.toString());
      (window as any).__marketTickerStartTime = startTime;
      return startTime;
    }
    
    // Create new start time
    const now = Date.now();
    localStorage.setItem(storageKey, now.toString());
    sessionStorage.setItem(sessionKey, now.toString());
    (window as any).__marketTickerStartTime = now;
    return now;
  };

  // Function to calculate animation parameters (only recalculate when stocks change)
  const updateAnimationParams = () => {
    const isMobile = window.innerWidth < 768;
    const stockCardWidth = 200;
    const gap = 16;
    const totalStockWidth = stocks.length * (stockCardWidth + gap);
    const containerWidth = window.innerWidth;
    const totalDistanceNeeded = totalStockWidth + containerWidth;
    
    const mobileSpeed = 150; // pixels per second (very very slow)
    const desktopSpeed = 120;
    const speed = isMobile ? mobileSpeed : desktopSpeed;
    
    const calculatedDuration = (totalDistanceNeeded / speed) * 1000;
    const finalDuration = Math.max(calculatedDuration, 10000);
    
    animationParamsRef.current = {
      duration: finalDuration,
      distance: totalDistanceNeeded
    };
    
    console.log(`Animation: ${stocks.length} stocks, ${Math.round(finalDuration/1000)}s, ${totalDistanceNeeded}px`);
  };
  
  // Function to set animation position based on elapsed time
  const setAnimationPosition = () => {
    if (animationRef.current) {
      if (isPausedRef.current) {
        // Maintain current position when paused
        const currentPos = pauseOffsetRef.current;
        animationRef.current.style.transform = `translateX(${currentPos}px)`;
      } else {
        const startTime = getAnimationStartTime();
        const elapsed = Date.now() - startTime;
        
        const { duration, distance } = animationParamsRef.current;
        // Use modulo for looping animation
        const progress = (elapsed % duration) / duration;
        const translateX = -progress * distance;
        pauseOffsetRef.current = translateX; // Store current position
        animationRef.current.style.transform = `translateX(${translateX}px)`;
      }
    }
  };
  
  const handleMouseEnter = () => {
    if (animationRef.current) {
      const transform = animationRef.current.style.transform;
      const match = transform.match(/translateX\((-?\d+)px\)/);
      if (match) {
        pauseOffsetRef.current = parseInt(match[1]);
      }
      pauseStartTimeRef.current = Date.now();
    }
    isPausedRef.current = true;
  };
  
  const handleMouseLeave = () => {
    if (animationRef.current && pauseStartTimeRef.current > 0) {
      // Adjust start time to account for pause duration
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      const currentStartTime = getAnimationStartTime();
      const newStartTime = currentStartTime - pauseDuration;
      
      localStorage.setItem('marketTickerStartTime', newStartTime.toString());
      sessionStorage.setItem('marketTickerSessionTime', newStartTime.toString());
      (window as any).__marketTickerStartTime = newStartTime;
    }
    isPausedRef.current = false;
  };

  // Function to reset animation to start from NIFTY 200
  const resetAnimationToStart = () => {
    const now = Date.now();
    localStorage.setItem('marketTickerStartTime', now.toString());
    sessionStorage.setItem('marketTickerSessionTime', now.toString());
    (window as any).__marketTickerStartTime = now;
    
    if (animationRef.current) {
      animationRef.current.style.transform = 'translateX(0px)';
    }
  };

  // Initial data load (only runs once)
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.allStocks);
        
        // Handle different response structures
        let allStocks = [];
        if (response.data && Array.isArray(response.data)) {
          allStocks = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else {
          throw new Error('Invalid API response structure');
        }
        
        // Use all stocks instead of limiting to 10
        const finalStocks = allStocks;
        
        // Set stocks on initial load
        setStocks(finalStocks);
        setIsLoading(false);
        
        // Update animation parameters when stocks are loaded
        setTimeout(() => updateAnimationParams(), 0);
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []); // Empty dependency array - only runs once

  // Update animation parameters when stocks change
  useEffect(() => {
    if (stocks.length > 0) {
      updateAnimationParams();
    }
  }, [stocks.length]); // Only recalculate when stock count changes

  // Periodic refresh to update stock values using React state
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.allStocks);
        
        let allStocks = [];
        if (response.data && Array.isArray(response.data)) {
          allStocks = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        }

        if (allStocks.length > 0) {
          // Update state properly using React pattern
          setStocks(allStocks);
        }
      } catch (err) {
        // Silently handle refresh errors
      }
    }, 60000); // Refresh every 60 seconds (less frequent to prevent flickering)

    return () => clearInterval(interval);
  }, []); // Empty dependency array - runs independently

  // Set initial animation position and start very slow animation
  useEffect(() => {
    // Set initial position immediately
    setAnimationPosition();
    
    // Start the animation loop with very slow movement
    const animationInterval = setInterval(() => {
      setAnimationPosition();
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(animationInterval);
  }, []); // Empty dependency array - animation runs independently

  // Cleanup storage on component unmount (optional)
  useEffect(() => {
    return () => {
      // Uncomment the lines below if you want to reset animation on component unmount
      // localStorage.removeItem('marketTickerStartTime');
      // sessionStorage.removeItem('marketTickerSessionTime');
      // delete (window as any).__marketTickerStartTime;
    };
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Stock data is temporarily unavailable. Please wait for one minute and try again." />;

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-background via-card/50 to-background"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Sliding Animation Container */}
      <div ref={animationRef} className="flex transition-none">
            {/* First set of stocks */}
            <div className="flex gap-4 min-w-max">
              {stocks.map((stock, index) => {
                const isPositive = (stock.change || 0) >= 0;
                return (
                  <div
                    key={`first-${stock.symbol}-${index}`}
                    data-stock-symbol={stock.symbol}
                    className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-sm border border-border min-w-[200px] hover:shadow-md transition-all backdrop-blur-sm"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">{stock.symbol}</p>
                      {stock.name && (
                        <p className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">{stock.name}</p>
                      )}
                      <p data-price className="text-lg font-semibold text-foreground mt-1">
                        ₹{(stock.lastPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div data-pchange className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span data-change className="text-sm font-medium">
                        {isPositive ? '+' : ''}{(stock.pChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
        
        {/* Duplicate set for seamless scrolling */}
        <div className="flex gap-4 min-w-max ml-8">
          {stocks.map((stock, index) => {
            const isPositive = (stock.change || 0) >= 0;
            return (
              <div
                key={`second-${stock.symbol}-${index}`}
                data-stock-symbol={stock.symbol}
                className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-sm border border-border min-w-[200px] hover:shadow-md transition-all backdrop-blur-sm"
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{stock.symbol}</p>
                  {stock.name && (
                    <p className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">{stock.name}</p>
                  )}
                  <p data-price className="text-lg font-semibold text-foreground mt-1">
                    ₹{(stock.lastPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div data-pchange className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span data-change className="text-sm font-medium">
                    {isPositive ? '+' : ''}{(stock.pChange || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketTicker;
