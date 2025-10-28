import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react"

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: {
    icon: React.ReactNode
    label: string
    color: string
  }
  rightAction?: {
    icon: React.ReactNode
    label: string
    color: string
  }
  className?: string
}

export const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className
}: SwipeableCardProps) => {
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - startX
    setCurrentX(deltaX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    
    const threshold = 100 // Minimum swipe distance
    
    if (currentX > threshold && onSwipeRight) {
      onSwipeRight()
    } else if (currentX < -threshold && onSwipeLeft) {
      onSwipeLeft()
    }
    
    // Reset
    setCurrentX(0)
    setIsDragging(false)
  }

  const transform = isDragging ? `translateX(${currentX}px)` : 'translateX(0px)'

  return (
    <div className="relative overflow-hidden">
      {/* Left Action Background */}
      {rightAction && currentX > 0 && (
        <div className={`absolute inset-y-0 left-0 flex items-center px-4 ${rightAction.color}`}>
          <div className="flex items-center space-x-2 text-white">
            {rightAction.icon}
            <span className="text-sm font-medium">{rightAction.label}</span>
          </div>
        </div>
      )}
      
      {/* Right Action Background */}
      {leftAction && currentX < 0 && (
        <div className={`absolute inset-y-0 right-0 flex items-center px-4 ${leftAction.color}`}>
          <div className="flex items-center space-x-2 text-white">
            <span className="text-sm font-medium">{leftAction.label}</span>
            {leftAction.icon}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        ref={cardRef}
        className={cn("transition-transform duration-200", className)}
        style={{ transform }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

interface TouchFriendlyButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "sm" | "default" | "lg"
  className?: string
  disabled?: boolean
}

export const TouchFriendlyButton = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false
}: TouchFriendlyButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        "min-h-[44px] min-w-[44px]", // Minimum touch target size
        "touch-manipulation", // Optimize for touch
        "select-none", // Prevent text selection on touch
        className
      )}
    >
      {children}
    </Button>
  )
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
}

export const PullToRefresh = ({
  onRefresh,
  children,
  threshold = 80
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - startY) * 0.5) // Reduce pull distance
    
    if (distance > 0) {
      e.preventDefault() // Prevent default scroll
      setPullDistance(Math.min(distance, threshold * 1.5))
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    setPullDistance(0)
  }

  const pullProgress = Math.min(pullDistance / threshold, 1)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div
      ref={containerRef}
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 overflow-hidden"
        style={{ 
          height: Math.max(0, pullDistance),
          opacity: pullProgress
        }}
      >
        <div className={cn(
          "flex items-center space-x-2 text-sm transition-colors",
          shouldTrigger ? "text-primary" : "text-muted-foreground"
        )}>
          <div
            className={cn(
              "w-6 h-6 rounded-full border-2 border-current transition-transform",
              isRefreshing && "animate-spin"
            )}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`
            }}
          />
          <span>
            {isRefreshing ? "Refreshing..." : shouldTrigger ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}

interface HorizontalScrollProps {
  children: React.ReactNode
  className?: string
  showScrollIndicators?: boolean
}

export const HorizontalScroll = ({
  children,
  className,
  showScrollIndicators = true
}: HorizontalScrollProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScrollability = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    checkScrollability()
    window.addEventListener('resize', checkScrollability)
    return () => window.removeEventListener('resize', checkScrollability)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    const scrollAmount = scrollRef.current.clientWidth * 0.8
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="relative">
      {/* Left scroll indicator */}
      {showScrollIndicators && canScrollLeft && (
        <Button
          variant="outline"
          size="sm"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 shadow-lg"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Right scroll indicator */}
      {showScrollIndicators && canScrollRight && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0 shadow-lg"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className={cn(
          "flex overflow-x-auto scrollbar-hide snap-x snap-mandatory",
          "touch-pan-x", // Optimize for horizontal scrolling
          className
        )}
        onScroll={checkScrollability}
      >
        {children}
      </div>
    </div>
  )
}

// Example usage components
export const SwipeableStockCard = ({ stock, onAddToWatchlist, onQuickTrade }: any) => (
  <SwipeableCard
    onSwipeLeft={() => onQuickTrade(stock)}
    onSwipeRight={() => onAddToWatchlist(stock)}
    leftAction={{
      icon: <TrendingUp className="h-5 w-5" />,
      label: "Trade",
      color: "bg-blue-500"
    }}
    rightAction={{
      icon: <TrendingDown className="h-5 w-5" />,
      label: "Watch",
      color: "bg-green-500"
    }}
  >
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{stock.symbol}</h3>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
        </div>
        <div className="text-right">
          <p className="font-medium">₹{stock.price}</p>
          <p className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%
          </p>
        </div>
      </div>
    </Card>
  </SwipeableCard>
)
