import { useState, useEffect } from "react"
import { X, Bell, BellRing, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { enhancedToast } from "@/components/ui/enhanced-toast"

interface Notification {
  id: string
  type: 'TRADE' | 'ALERT' | 'MILESTONE' | 'MARKET' | 'SYSTEM'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  action?: {
    label: string
    href: string
  }
}

const getNotificationIcon = (type: Notification['type']) => {
  const iconClasses = "h-4 w-4"
  switch (type) {
    case 'TRADE':
      return <div className="w-2 h-2 bg-green-500 rounded-full" />
    case 'ALERT':
      return <div className="w-2 h-2 bg-amber-500 rounded-full" />
    case 'MILESTONE':
      return <div className="w-2 h-2 bg-purple-500 rounded-full" />
    case 'MARKET':
      return <div className="w-2 h-2 bg-blue-500 rounded-full" />
    case 'SYSTEM':
      return <div className="w-2 h-2 bg-gray-500 rounded-full" />
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
  return `${Math.floor(diffInSeconds / 86400)}d`
}

export const DesktopNotificationBar = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications - replace with real data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'TRADE',
        title: 'Order Executed',
        message: 'BUY 10 shares of RELIANCE at ₹2,450 completed',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'MEDIUM',
        action: { label: 'View', href: '/portfolio' }
      },
      {
        id: '2',
        type: 'ALERT',
        title: 'Price Alert',
        message: 'TCS reached your target price of ₹3,800',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        priority: 'HIGH',
        action: { label: 'View', href: '/stocks/TCS' }
      },
      {
        id: '3',
        type: 'MILESTONE',
        title: 'Achievement Unlocked!',
        message: 'Portfolio reached ₹1,50,000',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'MEDIUM'
      },
      {
        id: '4',
        type: 'MARKET',
        title: 'Market Update',
        message: 'Nifty opens with strong bullish sentiment, up 2.3%',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        priority: 'LOW'
      }
    ]
    
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
    enhancedToast.success("All notifications marked as read")
  }

  const dismissNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const recentNotifications = notifications.slice(0, isExpanded ? notifications.length : 3)

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 hidden md:block">
      <Card className="mx-4 mt-4 border-0 shadow-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {unreadCount > 0 ? (
                  <BellRing className="h-5 w-5 text-blue-600" />
                ) : (
                  <Bell className="h-5 w-5 text-gray-500" />
                )}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 px-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs h-7"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              
              {notifications.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs h-7"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Show all ({notifications.length})
                    </>
                  )}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Notifications List */}
          <div className={cn(
            "transition-all duration-300",
            isExpanded ? "max-h-96" : "max-h-48"
          )}>
            <ScrollArea className="h-full">
              <div className="space-y-0">
                {recentNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div 
                      className={cn(
                        "px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors",
                        !notification.read && "bg-blue-50/50 dark:bg-blue-950/20"
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm truncate",
                                !notification.read ? "font-semibold text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-3">
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {formatTimeAgo(notification.timestamp)}
                              </span>
                              
                              {notification.action && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs h-6 px-2"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = notification.action!.href
                                  }}
                                >
                                  {notification.action.label}
                                </Button>
                              )}
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dismissNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                    {index < recentNotifications.length - 1 && (
                      <Separator className="mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <>
              <Separator />
              <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/notifications'}
                    className="text-xs h-6"
                  >
                    View all notifications
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook to manage the notification bar visibility
export const useDesktopNotificationBar = () => {
  const [isVisible, setIsVisible] = useState(true)
  
  const showNotificationBar = () => setIsVisible(true)
  const hideNotificationBar = () => setIsVisible(false)
  
  return {
    isVisible,
    showNotificationBar,
    hideNotificationBar
  }
}
