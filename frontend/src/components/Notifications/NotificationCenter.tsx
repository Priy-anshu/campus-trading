import { useState, useEffect } from "react"
import { Bell, X, TrendingUp, AlertTriangle, Info, Trophy, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  type: 'TRADE' | 'ALERT' | 'MILESTONE' | 'MARKET' | 'SYSTEM'
  title: string
  message: string
  timestamp: Date
  read: boolean
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  data?: any
  action?: {
    label: string
    href: string
  }
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'TRADE':
      return <TrendingUp className="h-4 w-4" />
    case 'ALERT':
      return <AlertTriangle className="h-4 w-4" />
    case 'MILESTONE':
      return <Trophy className="h-4 w-4" />
    case 'MARKET':
      return <DollarSign className="h-4 w-4" />
    case 'SYSTEM':
      return <Info className="h-4 w-4" />
  }
}

const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
  if (priority === 'HIGH') return 'text-red-600 bg-red-50 border-red-200'
  
  switch (type) {
    case 'TRADE':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'ALERT':
      return 'text-amber-600 bg-amber-50 border-amber-200'
    case 'MILESTONE':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'MARKET':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'SYSTEM':
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'TRADE',
        title: 'Order Executed',
        message: 'BUY 10 shares of RELIANCE at ₹2,450 completed successfully',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        priority: 'MEDIUM',
        action: { label: 'View Portfolio', href: '/portfolio' }
      },
      {
        id: '2',
        type: 'ALERT',
        title: 'Price Alert',
        message: 'TCS reached your target price of ₹3,800',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: false,
        priority: 'HIGH',
        action: { label: 'View Stock', href: '/stocks/TCS' }
      },
      {
        id: '3',
        type: 'MILESTONE',
        title: 'Achievement Unlocked!',
        message: 'Congratulations! Your portfolio reached ₹1,50,000',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 'MEDIUM'
      },
      {
        id: '4',
        type: 'MARKET',
        title: 'Market Update',
        message: 'Market opened with strong bullish sentiment. Nifty up 2.3%',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: true,
        priority: 'LOW'
      },
      {
        id: '5',
        type: 'SYSTEM',
        title: 'System Maintenance',
        message: 'Scheduled maintenance tonight from 11 PM to 1 AM IST',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
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
    setUnreadCount(prev => prev - 1)
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id)
      if (notification && !notification.read) {
        setUnreadCount(count => count - 1)
      }
      return prev.filter(n => n.id !== id)
    })
  }

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const today = new Date()
    const notificationDate = notification.timestamp
    const isToday = notificationDate.toDateString() === today.toDateString()
    const isYesterday = notificationDate.toDateString() === new Date(today.getTime() - 86400000).toDateString()
    
    let group = 'Older'
    if (isToday) group = 'Today'
    else if (isYesterday) group = 'Yesterday'
    
    if (!groups[group]) groups[group] = []
    groups[group].push(notification)
    return groups
  }, {} as Record<string, Notification[]>)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll see updates about your trades and market alerts here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
                    <div key={group}>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                        {group}
                      </div>
                      {groupNotifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div 
                            className={cn(
                              "px-4 py-3 hover:bg-muted/50 cursor-pointer relative",
                              !notification.read && "bg-blue-50/50 border-l-2 border-l-blue-500"
                            )}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "p-1.5 rounded-full",
                                getNotificationColor(notification.type, notification.priority)
                              )}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium truncate">
                                    {notification.title}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteNotification(notification.id)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <p className="text-xs text-muted-foreground mb-1">
                                  {notification.message}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatTimeAgo(notification.timestamp)}</span>
                                  </div>
                                  
                                  {notification.action && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-xs h-6"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        window.location.href = notification.action!.href
                                      }}
                                    >
                                      {notification.action.label}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
                              )}
                            </div>
                          </div>
                          {index < groupNotifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    unreadCount: notifications.filter(n => !n.read).length
  }
}
