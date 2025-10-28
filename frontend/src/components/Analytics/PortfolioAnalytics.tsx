import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  PieChart, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Activity
} from "lucide-react"
import { formatCurrency } from "@/utils/formatCurrency"
import { usePortfolio } from "@/hooks/usePortfolio"

interface HoldingAnalysis {
  symbol: string
  name: string
  allocation: number
  value: number
  performance: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  sector: string
}

interface SectorAllocation {
  sector: string
  allocation: number
  value: number
  performance: number
  stocks: string[]
}

const SECTOR_COLORS = {
  'Technology': '#3b82f6',
  'Banking': '#10b981',
  'Energy': '#f59e0b',
  'Healthcare': '#ef4444',
  'Auto': '#8b5cf6',
  'Consumer': '#06b6d4',
  'Other': '#6b7280'
}

export const PortfolioAnalytics = () => {
  const { portfolioData, loading } = usePortfolio()
  const [timeRange, setTimeRange] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M')
  const [sectorData, setSectorData] = useState<SectorAllocation[]>([])
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    if (portfolioData?.holdings) {
      analyzeSectorAllocation()
      generateInsights()
    }
  }, [portfolioData])

  const analyzeSectorAllocation = () => {
    if (!portfolioData?.holdings) return

    const sectorMap = new Map<string, SectorAllocation>()
    const totalValue = portfolioData.holdings.reduce((sum, holding) => 
      sum + (holding.quantity * holding.currentPrice), 0
    )

    portfolioData.holdings.forEach(holding => {
      const sector = getSectorFromSymbol(holding.symbol)
      const value = holding.quantity * holding.currentPrice
      const performance = ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100

      if (sectorMap.has(sector)) {
        const existing = sectorMap.get(sector)!
        existing.value += value
        existing.stocks.push(holding.symbol)
        existing.performance = (existing.performance + performance) / 2 // Average performance
      } else {
        sectorMap.set(sector, {
          sector,
          allocation: 0,
          value,
          performance,
          stocks: [holding.symbol]
        })
      }
    })

    // Calculate allocations
    const sectors = Array.from(sectorMap.values()).map(sector => ({
      ...sector,
      allocation: (sector.value / totalValue) * 100
    }))

    setSectorData(sectors.sort((a, b) => b.allocation - a.allocation))
  }

  const generateInsights = () => {
    if (!portfolioData?.holdings || !sectorData.length) return

    const newInsights: string[] = []
    const totalValue = portfolioData.summary?.currentValue || 0
    const totalReturn = portfolioData.summary?.totalReturnPercent || 0

    // Diversification insight
    const topSectorAllocation = sectorData[0]?.allocation || 0
    if (topSectorAllocation > 60) {
      newInsights.push(`Consider diversifying: ${sectorData[0]?.sector} makes up ${topSectorAllocation.toFixed(1)}% of your portfolio`)
    }

    // Performance insight
    if (totalReturn > 10) {
      newInsights.push(`Great performance! Your portfolio is up ${totalReturn.toFixed(1)}% 🎉`)
    } else if (totalReturn < -5) {
      newInsights.push(`Consider reviewing your positions. Portfolio is down ${Math.abs(totalReturn).toFixed(1)}%`)
    }

    // Top performer insight
    const topPerformer = portfolioData.holdings.reduce((best, current) => {
      const currentPerf = ((current.currentPrice - current.averagePrice) / current.averagePrice) * 100
      const bestPerf = ((best.currentPrice - best.averagePrice) / best.averagePrice) * 100
      return currentPerf > bestPerf ? current : best
    })
    
    const topPerformance = ((topPerformer.currentPrice - topPerformer.averagePrice) / topPerformer.averagePrice) * 100
    if (topPerformance > 15) {
      newInsights.push(`${topPerformer.symbol} is your top performer at +${topPerformance.toFixed(1)}%`)
    }

    setInsights(newInsights)
  }

  const getSectorFromSymbol = (symbol: string): string => {
    const sectorMap: Record<string, string> = {
      'TCS': 'Technology', 'INFY': 'Technology', 'WIPRO': 'Technology', 'HCLTECH': 'Technology',
      'HDFCBANK': 'Banking', 'ICICIBANK': 'Banking', 'SBIN': 'Banking', 'AXISBANK': 'Banking',
      'RELIANCE': 'Energy', 'ONGC': 'Energy', 'BPCL': 'Energy', 'IOC': 'Energy',
      'SUNPHARMA': 'Healthcare', 'DRREDDY': 'Healthcare', 'CIPLA': 'Healthcare',
      'MARUTI': 'Auto', 'TATAMOTORS': 'Auto', 'M&M': 'Auto'
    }
    return sectorMap[symbol] || 'Other'
  }

  const getRiskLevel = (volatility: number): 'LOW' | 'MEDIUM' | 'HIGH' => {
    if (volatility < 5) return 'LOW'
    if (volatility < 15) return 'MEDIUM'
    return 'HIGH'
  }

  if (loading || !portfolioData?.holdings?.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Portfolio Analytics</h3>
            <p className="text-muted-foreground">
              {loading ? "Loading analytics..." : "Start investing to see detailed analytics"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Insights Banner */}
      {insights.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Portfolio Insights
                </h4>
                <div className="space-y-1">
                  {insights.map((insight, index) => (
                    <p key={index} className="text-sm text-blue-700 dark:text-blue-200">
                      • {insight}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <TabsList>
            <TabsTrigger value="1D">1D</TabsTrigger>
            <TabsTrigger value="1W">1W</TabsTrigger>
            <TabsTrigger value="1M">1M</TabsTrigger>
            <TabsTrigger value="3M">3M</TabsTrigger>
            <TabsTrigger value="1Y">1Y</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sector Allocation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5" />
                <span>Sector Allocation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectorData.map((sector, index) => (
                  <div key={sector.sector} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: SECTOR_COLORS[sector.sector as keyof typeof SECTOR_COLORS] || '#6b7280' }}
                        />
                        <span className="font-medium">{sector.sector}</span>
                        <Badge variant={sector.performance >= 0 ? "default" : "destructive"} className="text-xs">
                          {sector.performance >= 0 ? '+' : ''}{sector.performance.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{sector.allocation.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(sector.value)}
                        </p>
                      </div>
                    </div>
                    <Progress value={sector.allocation} className="h-2" />
                    <div className="flex flex-wrap gap-1">
                      {sector.stocks.map(stock => (
                        <Badge key={stock} variant="outline" className="text-xs">
                          {stock}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance Metrics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Total Value</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(portfolioData.summary?.currentValue || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Invested: {formatCurrency(portfolioData.summary?.investedValue || 0)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Percent className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Total Return</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    (portfolioData.summary?.totalReturnPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(portfolioData.summary?.totalReturnPercent || 0) >= 0 ? '+' : ''}
                    {(portfolioData.summary?.totalReturnPercent || 0).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(portfolioData.summary?.totalReturn || 0)}
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Best Performer</span>
                  </div>
                  {portfolioData.holdings.length > 0 && (
                    <>
                      <p className="text-lg font-bold">
                        {portfolioData.holdings.reduce((best, current) => {
                          const currentPerf = ((current.currentPrice - current.averagePrice) / current.averagePrice) * 100
                          const bestPerf = ((best.currentPrice - best.averagePrice) / best.averagePrice) * 100
                          return currentPerf > bestPerf ? current : best
                        }).symbol}
                      </p>
                      <p className="text-sm text-green-600">
                        +{(((portfolioData.holdings.reduce((best, current) => {
                          const currentPerf = ((current.currentPrice - current.averagePrice) / current.averagePrice) * 100
                          const bestPerf = ((best.currentPrice - best.averagePrice) / best.averagePrice) * 100
                          return currentPerf > bestPerf ? current : best
                        }).currentPrice - portfolioData.holdings.reduce((best, current) => {
                          const currentPerf = ((current.currentPrice - current.averagePrice) / current.averagePrice) * 100
                          const bestPerf = ((best.currentPrice - best.averagePrice) / best.averagePrice) * 100
                          return currentPerf > bestPerf ? current : best
                        }).averagePrice) / portfolioData.holdings.reduce((best, current) => {
                          const currentPerf = ((current.currentPrice - current.averagePrice) / current.averagePrice) * 100
                          const bestPerf = ((best.currentPrice - best.averagePrice) / best.averagePrice) * 100
                          return currentPerf > bestPerf ? current : best
                        }).averagePrice) * 100).toFixed(2)}%
                      </p>
                    </>
                  )}
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Diversification</span>
                  </div>
                  <p className="text-lg font-bold">
                    {sectorData.length} Sectors
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {portfolioData.holdings.length} Holdings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Holdings Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Stock</th>
                    <th className="text-right p-2">Allocation</th>
                    <th className="text-right p-2">Value</th>
                    <th className="text-right p-2">Return</th>
                    <th className="text-right p-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioData.holdings.map((holding) => {
                    const value = holding.quantity * holding.currentPrice
                    const totalValue = portfolioData.summary?.currentValue || 1
                    const allocation = (value / totalValue) * 100
                    const performance = ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100
                    const risk = getRiskLevel(Math.abs(performance))
                    
                    return (
                      <tr key={holding.symbol} className="border-b">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{holding.symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {holding.quantity} shares @ ₹{holding.currentPrice}
                            </p>
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">
                          {allocation.toFixed(1)}%
                        </td>
                        <td className="text-right p-2">
                          {formatCurrency(value)}
                        </td>
                        <td className={`text-right p-2 font-medium ${
                          performance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                        </td>
                        <td className="text-right p-2">
                          <Badge 
                            variant={risk === 'LOW' ? 'default' : risk === 'MEDIUM' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {risk}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
