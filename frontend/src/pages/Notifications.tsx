import { useState, useEffect } from "react"
import { ArrowLeft, Bell, Check, X, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/Navbar"

interface Notification {
  id: string
  type: 'BUY' | 'SELL'
  symbol: string
  quantity: number
  price: number
  timestamp: Date
  read: boolean
}

const getNotificationIcon = (type: Notification['type']) => {
  if (type === 'BUY') {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30">
        <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
    )
  } else {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30">
        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
    )
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

const Notifications = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [unreadCount, setUnreadCount] = useState(0)

  // Load real notifications from localStorage
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

    // Listen for new notifications
    const handleNewNotification = () => {
      loadNotifications()
    }

    window.addEventListener('newTradeNotification', handleNewNotification)
    
    return () => {
      window.removeEventListener('newTradeNotification', handleNewNotification)
    }
  }, [])

  // Filter notifications based on tab
  useEffect(() => {
    let filtered = notifications

    if (activeTab === 'read') {
      filtered = filtered.filter(n => n.read)
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.read)
    }
    // 'all' shows everything

    setFilteredNotifications(filtered)
  }, [notifications, activeTab])

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
    toast({
      title: "All notifications marked as read",
      description: "All your notifications have been marked as read."
    })
  }

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id)
      localStorage.setItem('tradeNotifications', JSON.stringify(updated))
      return updated
    })
    
    toast({
      title: "Notification deleted",
      description: "The notification has been removed."
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="md:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">Trade Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} size="sm" className="w-full md:w-auto">
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="p-8">
            <div className="text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {activeTab === 'unread' ? 'No unread notifications' : 
                 activeTab === 'read' ? 'No read notifications' : 
                 'No trade notifications yet'
                }
              </h3>
              <p className="text-muted-foreground">
                {activeTab === 'all' 
                  ? "You'll see notifications here when you buy or sell stocks"
                  : `Switch to other tabs to view ${activeTab === 'unread' ? 'read' : 'unread'} notifications`
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer border-l-4",
                  notification.type === 'BUY' 
                    ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/10" 
                    : "border-l-red-500 bg-red-50/30 dark:bg-red-950/10",
                  !notification.read && "shadow-sm bg-blue-50/20 dark:bg-blue-950/10"
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={cn(
                              "text-sm md:text-base",
                              !notification.read ? "font-semibold" : "font-medium"
                            )}>
                              {notification.type} Order Executed
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.type} {notification.quantity} shares of {notification.symbol} at ₹{notification.price.toLocaleString('en-IN')}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-muted-foreground hover:text-destructive h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Notifications
