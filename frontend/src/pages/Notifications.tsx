import { useState, useEffect } from "react"
import { ArrowLeft, Bell, Check, X, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { enhancedToast } from "@/components/ui/enhanced-toast"
import Navbar from "@/components/Navbar"
import { EmptyNotifications } from "@/components/EmptyStates"

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
  switch (type) {
    case 'TRADE':
      return '💹'
    case 'ALERT':
      return '🚨'
    case 'MILESTONE':
      return '🏆'
    case 'MARKET':
      return '📊'
    case 'SYSTEM':
      return 'ℹ️'
  }
}

const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
  if (priority === 'HIGH') return 'border-l-red-500 bg-red-50 dark:bg-red-950/20'
  
  switch (type) {
    case 'TRADE':
      return 'border-l-green-500 bg-green-50 dark:bg-green-950/20'
    case 'ALERT':
      return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20'
    case 'MILESTONE':
      return 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20'
    case 'MARKET':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
    case 'SYSTEM':
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-950/20'
  }
}

const formatDateTime = (date: Date) => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const Notifications = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock notifications - replace with real API call
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'TRADE',
        title: 'Order Executed Successfully',
        message: 'Your BUY order for 10 shares of RELIANCE at ₹2,450 has been executed successfully. Total amount: ₹24,500',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'MEDIUM',
        action: { label: 'View Portfolio', href: '/portfolio' }
      },
      {
        id: '2',
        type: 'ALERT',
        title: 'Price Alert Triggered',
        message: 'TCS has reached your target price of ₹3,800. Current price: ₹3,805 (+1.2%)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        priority: 'HIGH',
        action: { label: 'View Stock', href: '/stocks/TCS' }
      },
      {
        id: '3',
        type: 'MILESTONE',
        title: '🎉 Achievement Unlocked!',
        message: 'Congratulations! Your portfolio has reached ₹1,50,000. You\'ve achieved the "Growing Investor" milestone.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: true,
        priority: 'MEDIUM'
      },
      {
        id: '4',
        type: 'MARKET',
        title: 'Market Opening Bell',
        message: 'Markets opened with strong bullish sentiment. Nifty 50 up by 2.3% at 19,450. Banking sector leading the gains.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false,
        priority: 'LOW'
      },
      {
        id: '5',
        type: 'TRADE',
        title: 'Sell Order Executed',
        message: 'Your SELL order for 5 shares of INFY at ₹1,420 has been executed. Profit: ₹350 (+5.2%)',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        priority: 'MEDIUM',
        action: { label: 'View Trade', href: '/orders' }
      },
      {
        id: '6',
        type: 'SYSTEM',
        title: 'Scheduled Maintenance',
        message: 'System maintenance is scheduled for tonight from 11:00 PM to 1:00 AM IST. Trading will be temporarily unavailable.',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        read: true,
        priority: 'LOW'
      },
      {
        id: '7',
        type: 'ALERT',
        title: 'Low Balance Warning',
        message: 'Your wallet balance is running low (₹2,500 remaining). Consider selling some holdings or adding funds.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        read: false,
        priority: 'MEDIUM',
        action: { label: 'Manage Portfolio', href: '/portfolio' }
      }
    ]
    
    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter(n => !n.read).length)
  }, [])

  // Filter notifications based on tab and search
  useEffect(() => {
    let filtered = notifications

    // Filter by type
    if (activeTab !== 'all') {
      if (activeTab === 'unread') {
        filtered = filtered.filter(n => !n.read)
      } else {
        filtered = filtered.filter(n => n.type === activeTab.toUpperCase())
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotifications(filtered)
  }, [notifications, activeTab, searchQuery])

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

  const deleteNotification = (id: string) => {
    const notification = notifications.find(n => n.id === id)
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
    setNotifications(prev => prev.filter(n => n.id !== id))
    enhancedToast.success("Notification deleted")
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <h1 className="text-2xl md:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} size="sm">
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full md:w-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                  <TabsTrigger value="trade">Trades</TabsTrigger>
                  <TabsTrigger value="alert">Alerts</TabsTrigger>
                  <TabsTrigger value="market">Market</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <EmptyNotifications />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id}
                className={cn(
                  "transition-all hover:shadow-md cursor-pointer border-l-4",
                  getNotificationColor(notification.type, notification.priority),
                  !notification.read && "shadow-sm"
                )}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="text-2xl flex-shrink-0">
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
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(notification.timestamp)}
                            </span>
                            
                            <div className="flex items-center space-x-2">
                              {notification.action && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
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
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
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
