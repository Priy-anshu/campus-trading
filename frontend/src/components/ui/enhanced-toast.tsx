import { toast as baseToast } from "@/hooks/use-toast"
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Bell,
  Zap
} from "lucide-react"

export interface EnhancedToastOptions {
  title?: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Enhanced toast with better UX
export const enhancedToast = {
  success: (message: string, options?: EnhancedToastOptions) => {
    baseToast({
      title: options?.title || "Success!",
      description: message,
      duration: options?.duration || 4000,
      className: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
      action: options?.action ? (
        <button 
          onClick={options.action.onClick}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          {options.action.label}
        </button>
      ) : undefined
    })
  },

  error: (message: string, options?: EnhancedToastOptions) => {
    baseToast({
      variant: "destructive",
      title: options?.title || "Error",
      description: message,
      duration: options?.duration || 6000,
      action: options?.action ? (
        <button 
          onClick={options.action.onClick}
          className="text-red-100 hover:text-red-200 font-medium"
        >
          {options.action.label}
        </button>
      ) : undefined
    })
  },

  warning: (message: string, options?: EnhancedToastOptions) => {
    baseToast({
      title: options?.title || "Warning",
      description: message,
      duration: options?.duration || 5000,
      className: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
      action: options?.action ? (
        <button 
          onClick={options.action.onClick}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          {options.action.label}
        </button>
      ) : undefined
    })
  },

  info: (message: string, options?: EnhancedToastOptions) => {
    baseToast({
      title: options?.title || "Info",
      description: message,
      duration: options?.duration || 4000,
      className: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
      action: options?.action ? (
        <button 
          onClick={options.action.onClick}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          {options.action.label}
        </button>
      ) : undefined
    })
  },

  // Trading specific toasts
  tradeSuccess: (action: 'BUY' | 'SELL', stock: string, quantity: number, price: number, profit?: number) => {
    const total = quantity * price
    const isProfitable = profit !== undefined && profit > 0
    
    baseToast({
      title: `${action} Order Executed! ${isProfitable ? '🎉' : '✅'}`,
      description: `${action} ${quantity} shares of ${stock} at ₹${price.toLocaleString()}${profit !== undefined ? ` • ${profit > 0 ? 'Profit' : 'Loss'}: ₹${Math.abs(profit).toLocaleString()}` : ''}`,
      duration: 6000,
      className: isProfitable 
        ? "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
        : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
      action: (
        <button 
          onClick={() => window.location.href = '/portfolio'}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          View Portfolio
        </button>
      )
    })
  },

  priceAlert: (stock: string, currentPrice: number, targetPrice: number, direction: 'above' | 'below') => {
    const emoji = direction === 'above' ? '🚀' : '📉'
    baseToast({
      title: `Price Alert Triggered! ${emoji}`,
      description: `${stock} hit your target price of ₹${targetPrice.toLocaleString()} (Current: ₹${currentPrice.toLocaleString()})`,
      duration: 8000,
      className: "border-purple-200 bg-purple-50 text-purple-900 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-100",
      action: (
        <button 
          onClick={() => window.location.href = `/stocks/${stock}`}
          className="text-purple-600 hover:text-purple-700 font-medium"
        >
          View Stock
        </button>
      )
    })
  },

  balanceWarning: (balance: number) => {
    baseToast({
      title: "Low Balance Warning ⚠️",
      description: `Only ₹${balance.toLocaleString()} remaining in your wallet`,
      duration: 7000,
      className: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
      action: (
        <button 
          onClick={() => window.location.href = '/portfolio'}
          className="text-amber-600 hover:text-amber-700 font-medium"
        >
          Manage Portfolio
        </button>
      )
    })
  },

  marketUpdate: (message: string, type: 'open' | 'close' | 'news') => {
    const emoji = type === 'open' ? '🔔' : type === 'close' ? '🔕' : '📰'
    baseToast({
      title: `Market Update ${emoji}`,
      description: message,
      duration: 5000,
      className: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-100"
    })
  },

  milestone: (message: string, achievement: string) => {
    baseToast({
      title: `Achievement Unlocked! 🏆`,
      description: `${message} • ${achievement}`,
      duration: 8000,
      className: "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-100"
    })
  },

  connectionStatus: (isOnline: boolean) => {
    if (isOnline) {
      baseToast({
        title: "Connection Restored ✅",
        description: "You're back online. Data is being updated.",
        duration: 3000,
        className: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100"
      })
    } else {
      baseToast({
        title: "Connection Lost ⚠️",
        description: "You're offline. Some features may not work properly.",
        duration: 0, // Stay until dismissed
        className: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
      })
    }
  },

  dataRefresh: (component: string) => {
    baseToast({
      title: "Data Updated 🔄",
      description: `${component} has been refreshed with latest information`,
      duration: 2000,
      className: "border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
    })
  }
}

// Usage examples:
/*
enhancedToast.success("Portfolio updated successfully!")

enhancedToast.tradeSuccess('BUY', 'RELIANCE', 10, 2500, 1200)

enhancedToast.priceAlert('TCS', 3800, 3750, 'below')

enhancedToast.warning("Market closes in 30 minutes", {
  action: { label: "Place Orders", onClick: () => navigate('/') }
})

enhancedToast.milestone("Portfolio reached ₹1,50,000!", "Growth Master")
*/
