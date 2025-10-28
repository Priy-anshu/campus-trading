import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  TrendingUp, 
  Search, 
  PlusCircle, 
  BarChart3, 
  Wallet, 
  Eye,
  Activity,
  Target,
  Trophy
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary"
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

const EmptyState = ({ icon, title, description, action, secondaryAction }: EmptyStateProps) => (
  <Card className="border-dashed border-2">
    <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
      <div className="flex gap-3">
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || "default"}
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button 
            onClick={secondaryAction.onClick}
            variant="outline"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)

export const EmptyPortfolio = () => {
  const navigate = useNavigate()
  
  return (
    <EmptyState
      icon={<TrendingUp className="h-10 w-10 text-muted-foreground" />}
      title="Start Your Trading Journey"
      description="You haven't made any investments yet. Buy your first stock to see it here and start building your portfolio."
      action={{
        label: "Explore Stocks",
        onClick: () => navigate("/")
      }}
      secondaryAction={{
        label: "View Watchlist",
        onClick: () => navigate("/watchlist")
      }}
    />
  )
}

export const EmptyWatchlist = () => {
  const navigate = useNavigate()
  
  return (
    <EmptyState
      icon={<Eye className="h-10 w-10 text-muted-foreground" />}
      title="Your Watchlist is Empty"
      description="Add stocks to your watchlist to track their performance and get notified about price changes."
      action={{
        label: "Find Stocks to Watch",
        onClick: () => navigate("/")
      }}
    />
  )
}

export const EmptySearchResults = ({ query }: { query: string }) => (
  <EmptyState
    icon={<Search className="h-10 w-10 text-muted-foreground" />}
    title="No Stocks Found"
    description={`We couldn't find any stocks matching "${query}". Try searching with different keywords or stock symbols.`}
    action={{
      label: "Clear Search",
      onClick: () => window.location.reload(),
      variant: "outline"
    }}
  />
)

export const EmptyOrderHistory = () => {
  const navigate = useNavigate()
  
  return (
    <EmptyState
      icon={<Activity className="h-10 w-10 text-muted-foreground" />}
      title="No Trading History"
      description="You haven't made any trades yet. Your buy and sell orders will appear here once you start trading."
      action={{
        label: "Start Trading",
        onClick: () => navigate("/")
      }}
    />
  )
}

export const EmptyNotifications = () => (
  <EmptyState
    icon={<Target className="h-10 w-10 text-muted-foreground" />}
    title="No Notifications"
    description="You're all caught up! We'll notify you about important updates, price alerts, and trading opportunities."
  />
)

export const EmptyLeaderboard = () => (
  <EmptyState
    icon={<Trophy className="h-10 w-10 text-muted-foreground" />}
    title="Leaderboard Loading"
    description="The competition is heating up! Rankings will appear here as users start trading and building their portfolios."
  />
)

export const EmptyPriceAlerts = () => {
  const navigate = useNavigate()
  
  return (
    <EmptyState
      icon={<Target className="h-10 w-10 text-muted-foreground" />}
      title="No Price Alerts Set"
      description="Set up price alerts to get notified when your favorite stocks hit your target prices."
      action={{
        label: "Browse Stocks",
        onClick: () => navigate("/")
      }}
    />
  )
}

export const EmptyDashboard = () => {
  const navigate = useNavigate()
  
  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mb-6">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Campus Trading!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            You're ready to start your trading journey with ₹1,00,000 virtual currency. 
            Explore stocks, make trades, and compete with other students!
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/")}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Start Trading
            </Button>
            <Button onClick={() => navigate("/watchlist")} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const LowBalance = ({ balance }: { balance: number }) => {
  const navigate = useNavigate()
  
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
            <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Low Balance Warning
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Only ₹{balance.toLocaleString()} remaining in your wallet
            </p>
          </div>
        </div>
        <Button 
          onClick={() => navigate("/portfolio")}
          variant="outline" 
          size="sm"
          className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
        >
          Sell Holdings
        </Button>
      </CardContent>
    </Card>
  )
}
