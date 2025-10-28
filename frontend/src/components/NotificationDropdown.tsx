import { useState, useEffect } from "react"
import { Bell, BellRing, X, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

interface Notification {
  id: string
  type: 'BUY' | 'SELL'
  symbol: string
  quantity: number
  price: number
  timestamp: Date
  read: boolean
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

interface NotificationDropdownProps {
  isOpen: boolean
  onToggle: () => void
}

export const NotificationDropdown = ({ isOpen, onToggle }: NotificationDropdownProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  // Load notifications from localStorage on component mount
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('tradeNotifications')
        if (stored) {
          const parsed = JSON.parse(stored).map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }))
          setNotifications(parsed)
          setUnreadCount(parsed.filter((n: Notification) => !n.read).length)
        }
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()

    // Listen for new trade notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: event.detail.type,
        symbol: event.detail.symbol,
        quantity: event.detail.quantity,
        price: event.detail.price,
        timestamp: new Date(),
        read: false
      }

      setNotifications(prev => {
        const updated = [newNotification, ...prev].slice(0, 50) // Keep only latest 50
        localStorage.setItem('tradeNotifications', JSON.stringify(updated))
        return updated
      })
      
      setUnreadCount(prev => prev + 1)
    }

    window.addEventListener('newTradeNotification', handleNewNotification as EventListener)
    
    return () => {
      window.removeEventListener('newTradeNotification', handleNewNotification as EventListener)
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
      localStorage.setItem('tradeNotifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notification => ({ ...notification, read: true }))
      localStorage.setItem('tradeNotifications', JSON.stringify(updated))
      return updated
    })
    setUnreadCount(0)
  }

  const removeNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem('tradeNotifications', JSON.stringify(updated))
      return updated
    })
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-10 w-80 max-h-[calc(100vh-5rem)] rounded-md border border-border bg-popover shadow-lg z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center space-x-2">
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 text-blue-600" />
          ) : (
            <Bell className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="font-semibold text-sm">Trade Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-2 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-6 px-2"
            >
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Notifications List */}
      <ScrollArea className="max-h-80">
        <div className="max-h-80">
          {notifications.length > 0 ? (
            <div className="space-y-0">
              {notifications.slice(0, 10).map((notification, index) => (
                <div key={notification.id}>
                  <div 
                    className={cn(
                      "group px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          {notification.type === 'BUY' ? (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-400" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
                              <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm",
                            !notification.read ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}>
                            {notification.type} Order Executed
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            {notification.type} {notification.quantity} shares of {notification.symbol} at ₹{notification.price.toLocaleString('en-IN')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start flex-col space-y-1 flex-shrink-0">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < notifications.slice(0, 10).length - 1 && (
                    <Separator className="mx-4" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No trade notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll see notifications here when you buy or sell stocks
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 10 && (
        <>
          <Separator />
          <div className="p-3 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onToggle()
                navigate('/notifications')
              }}
              className="text-xs w-full h-7"
            >
              View all notifications ({notifications.length})
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// Function to trigger a new trade notification
export const addTradeNotification = (type: 'BUY' | 'SELL', symbol: string, quantity: number, price: number) => {
  const event = new CustomEvent('newTradeNotification', {
    detail: { type, symbol, quantity, price }
  })
  window.dispatchEvent(event)
}
