import { useState, useEffect, useRef } from "react"
import { Search, TrendingUp, Clock, Star, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useNavigate } from "react-router-dom"
import { ENDPOINTS, apiClient } from "@/api/config"
import { useDebounce } from "@/hooks/useDebounce"

interface StockSuggestion {
  symbol: string
  name: string
  price: number
  changePercent: number
  sector?: string
  volume?: number
}

interface EnhancedStockSearchProps {
  onStockSelect?: (stock: StockSuggestion) => void
  placeholder?: string
  showCategories?: boolean
  className?: string
}

const STOCK_CATEGORIES = {
  "Technology": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
  "Banking": ["HDFCBANK", "ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
  "Energy": ["RELIANCE", "ONGC", "BPCL", "IOC", "GAIL"],
  "Auto": ["MARUTI", "TATAMOTORS", "M&M", "BAJAJ-AUTO", "HEROMOTOCO"],
  "Pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "LUPIN"]
}

const TRENDING_STOCKS = ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"]

export const EnhancedStockSearch = ({
  onStockSelect,
  placeholder = "Search stocks, companies, or sectors...",
  showCategories = true,
  className = ""
}: EnhancedStockSearchProps) => {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentStockSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Search stocks when query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      searchStocks(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  const searchStocks = async (searchQuery: string) => {
    setLoading(true)
    try {
      const { data } = await apiClient.get(ENDPOINTS.searchStocks, {
        params: { q: searchQuery }
      })
      setSuggestions(data.slice(0, 8)) // Limit to 8 results
    } catch (error) {
      console.error('Stock search failed:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const getCategoryStocks = async (category: string) => {
    setLoading(true)
    try {
      const stockSymbols = STOCK_CATEGORIES[category as keyof typeof STOCK_CATEGORIES]
      const promises = stockSymbols.map(symbol => 
        apiClient.get(ENDPOINTS.stockSearch, { params: { symbol } })
      )
      const results = await Promise.all(promises)
      const stocks = results.map(result => result.data[0]).filter(Boolean)
      setSuggestions(stocks.slice(0, 6))
      setSelectedCategory(category)
    } catch (error) {
      console.error('Category search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStockSelect = (stock: StockSuggestion) => {
    // Save to recent searches
    const updatedRecent = [stock.symbol, ...recentSearches.filter(s => s !== stock.symbol)].slice(0, 5)
    setRecentSearches(updatedRecent)
    localStorage.setItem('recentStockSearches', JSON.stringify(updatedRecent))

    // Clear search
    setQuery("")
    setIsOpen(false)
    setSelectedCategory(null)

    if (onStockSelect) {
      onStockSelect(stock)
    } else {
      navigate(`/stocks/${stock.symbol}`)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentStockSearches')
  }

  const formatPrice = (price: number, changePercent: number) => ({
    price: `₹${price.toLocaleString()}`,
    change: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
    isPositive: changePercent >= 0
  })

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-10 pr-4"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1 h-8 w-8 p-0"
            onClick={() => {
              setQuery("")
              setSuggestions([])
              setSelectedCategory(null)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full mt-2 w-full z-20 max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {/* Categories */}
              {showCategories && !query && (
                <div className="p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Browse by Sector</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(STOCK_CATEGORIES).map((category) => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => getCategoryStocks(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <>
                  <Separator />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">Recent Searches</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearRecentSearches}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {recentSearches.map((symbol) => (
                        <div
                          key={symbol}
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => navigate(`/stocks/${symbol}`)}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{symbol}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Trending Stocks */}
              {!query && !selectedCategory && (
                <>
                  <Separator />
                  <div className="p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Trending Stocks</p>
                    <div className="space-y-2">
                      {TRENDING_STOCKS.map((symbol) => (
                        <div
                          key={symbol}
                          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted cursor-pointer"
                          onClick={() => navigate(`/stocks/${symbol}`)}
                        >
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">{symbol}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Search Results */}
              {(suggestions.length > 0 || loading) && (
                <>
                  <Separator />
                  <div className="p-4">
                    {selectedCategory && (
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          {selectedCategory} Stocks
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCategory(null)
                            setSuggestions([])
                          }}
                          className="text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      </div>
                    )}
                    
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {suggestions.map((stock) => {
                          const { price, change, isPositive } = formatPrice(stock.price, stock.changePercent)
                          return (
                            <div
                              key={stock.symbol}
                              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => handleStockSelect(stock)}
                            >
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{stock.symbol}</span>
                                  {stock.sector && (
                                    <Badge variant="outline" className="text-xs">
                                      {stock.sector}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {stock.name}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{price}</p>
                                <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {change}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* No Results */}
              {query && !loading && suggestions.length === 0 && (
                <div className="p-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No stocks found for "{query}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try searching with stock symbols or company names
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
