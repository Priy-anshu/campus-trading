import { useState, useEffect } from "react";
import { ENDPOINTS, apiClient } from "@/api/config";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/utils/formatCurrency";

/**
 * Props interface for TradePanel component
 * @interface TradePanelProps
 * @property {string} symbol - Stock symbol (e.g., 'RELIANCE', 'TCS')
 * @property {number} currentPrice - Current market price of the stock
 * @property {() => void} [onTradeSuccess] - Optional callback function triggered after successful buy/sell
 */
interface TradePanelProps {
  symbol: string;
  currentPrice: number;
  onTradeSuccess?: () => void; // Callback for successful trade
}

/**
 * TradePanel Component
 * 
 * A comprehensive trading interface that allows users to buy and sell stocks.
 * Features include order type selection (delivery, intraday, MTF), price type selection
 * (market/limit orders), quantity input, and real-time balance/quantity validation.
 * 
 * @param {TradePanelProps} props - Component props
 * @returns {JSX.Element} The trading panel interface
 */
const TradePanel = ({ symbol, currentPrice, onTradeSuccess }: TradePanelProps) => {
  // State for order quantity - minimum 1 share
  const [quantity, setQuantity] = useState(1);
  
  // State for order type: delivery (long-term), intraday (same-day), MTF (margin trading)
  const [orderType, setOrderType] = useState("delivery");
  
  // State for price type: market (current price) or limit (user-specified price)
  const [priceType, setPriceType] = useState("market");
  
  // State for limit price when user selects limit order type
  const [limitPrice, setLimitPrice] = useState(currentPrice);
  
  // State to prevent multiple simultaneous order submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for user's available wallet balance
  const [walletBalance, setWalletBalance] = useState(0);
  
  // State for available quantity of the current stock in user's portfolio
  const [availableQuantity, setAvailableQuantity] = useState(0);
  
  // Toast notification hook for user feedback
  const { toast } = useToast();

  /**
   * Calculate the total cost of the order
   * Uses market price for market orders, limit price for limit orders
   * @returns {string} Total cost formatted to 2 decimal places
   */
  const calculateTotal = () => {
    const price = priceType === "market" ? currentPrice : limitPrice;
    return (price * quantity).toFixed(2);
  };

  /**
   * Fetch user's portfolio data to get wallet balance and available stock quantity
   * This runs when the component mounts or when the symbol changes
   */
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        // Get user's portfolio data including wallet balance and holdings
        const { data } = await apiClient.get(ENDPOINTS.portfolio);
        setWalletBalance(data.walletBalance || 0);
        
        // Find the specific stock holding to get available quantity for selling
        const holding = data.holdings?.find((h: any) => h.symbol === symbol);
        setAvailableQuantity(holding?.quantity || 0);
      } catch (err) {
        // Silently handle errors to prevent UI disruption
      }
    };
    
    fetchPortfolioData();
  }, [symbol]);

  /**
   * Handle stock purchase order
   * Validates price, submits order to backend, shows success/error feedback
   * Triggers data refresh after successful purchase
   */
  const handleBuy = async () => {
    try {
      // Prevent multiple simultaneous submissions
      setIsSubmitting(true);
      
      // Determine effective price based on order type
      const effectivePrice = priceType === "market" ? currentPrice : limitPrice;
      
      // Validate price before proceeding
      if (!effectivePrice || effectivePrice <= 0) {
        toast({ title: "Invalid Price", description: "Please check the stock price and try again" });
        return;
      }
      
      // Submit buy order to backend API
      await apiClient.post(ENDPOINTS.buy, {
        symbol,
        quantity,
        price: effectivePrice,
        orderCategory: orderType
      });
      
      // Show success notification
      toast({ title: "Order placed", description: `Bought ${quantity} ${symbol}` });
      
      // Trigger data refresh after successful trade
      if (onTradeSuccess) {
        onTradeSuccess();
      } else {
        // Fallback: reload the page after a short delay to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      // Handle and display error messages
      const msg = err?.response?.data?.message || "Order failed";
      toast({ title: "Order failed", description: msg });
    } finally {
      // Always reset submission state
      setIsSubmitting(false);
    }
  };

  /**
   * Handle stock sell order
   * Validates price, submits order to backend, shows success/error feedback
   * Triggers data refresh after successful sale
   */
  const handleSell = async () => {
    try {
      // Prevent multiple simultaneous submissions
      setIsSubmitting(true);
      
      // Determine effective price based on order type
      const effectivePrice = priceType === "market" ? currentPrice : limitPrice;
      
      // Validate price before proceeding
      if (!effectivePrice || effectivePrice <= 0) {
        toast({ title: "Invalid Price", description: "Please check the stock price and try again" });
        return;
      }
      
      // Submit sell order to backend API
      await apiClient.post(ENDPOINTS.sell, {
        symbol,
        quantity,
        price: effectivePrice,
        orderCategory: orderType
      });
      
      // Show success notification
      toast({ title: "Order placed", description: `Sold ${quantity} ${symbol}` });
      
      // Trigger data refresh after successful trade
      if (onTradeSuccess) {
        onTradeSuccess();
      } else {
        // Fallback: reload the page after a short delay to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      // Handle and display error messages
      const msg = err?.response?.data?.message || "Order failed";
      toast({ title: "Order failed", description: msg });
    } finally {
      // Always reset submission state
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy">Buy</TabsTrigger>
          <TabsTrigger value="sell">Sell</TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4 pt-4">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <div className="flex gap-2">
              {["delivery", "intraday"].map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className="flex-1 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <Select defaultValue="nse">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nse">NSE</SelectItem>
                  <SelectItem value="bse">BSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Type</Label>
            <div className="flex gap-2">
              <Button
                variant={priceType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("market")}
                className="flex-1 text-xs"
              >
                Market
              </Button>
              {/* Limit price type commented out */}
              {/* <Button
                variant={priceType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("limit")}
                className="flex-1 text-xs"
              >
                Limit
              </Button> */}
            </div>
          </div>

          {/* Limit Price - commented out */}
          {/* {priceType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="limitPrice" className="text-sm font-medium">
                Limit Price
              </Label>
              <Input
                id="limitPrice"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              />
            </div>
          )} */}

          {/* Summary */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Balance Available</span>
              <span className="font-medium">{formatCurrency(walletBalance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approx. Required</span>
              <span className="font-medium">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Buy Button */}
          <Button
            onClick={handleBuy}
            disabled={isSubmitting}
            className="w-full bg-success text-white hover:bg-success/90"
          >
            Buy
          </Button>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4 pt-4">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <div className="flex gap-2">
              {["delivery", "intraday"].map((type) => (
                <Button
                  key={type}
                  variant={orderType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderType(type)}
                  className="flex-1 text-xs capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="sell-quantity" className="text-sm font-medium">
              Quantity
            </Label>
            <div className="flex gap-2">
              <Input
                id="sell-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="flex-1"
              />
              <Select defaultValue="nse">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nse">NSE</SelectItem>
                  <SelectItem value="bse">BSE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Price Type</Label>
            <div className="flex gap-2">
              <Button
                variant={priceType === "market" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("market")}
                className="flex-1 text-xs"
              >
                Market
              </Button>
              {/* Limit price type commented out */}
              {/* <Button
                variant={priceType === "limit" ? "default" : "outline"}
                size="sm"
                onClick={() => setPriceType("limit")}
                className="flex-1 text-xs"
              >
                Limit
              </Button> */}
            </div>
          </div>

          {/* Limit Price */}
          {priceType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="sell-limitPrice" className="text-sm font-medium">
                Limit Price
              </Label>
              <Input
                id="sell-limitPrice"
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
              />
            </div>
          )}

          {/* Summary */}
          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Qty</span>
              <span className="font-medium">{availableQuantity} shares</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approx. Returns</span>
              <span className="font-medium">₹{calculateTotal()}</span>
            </div>
          </div>

          {/* Sell Button */}
          <Button
            onClick={handleSell}
            disabled={isSubmitting}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Sell
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

export default TradePanel;
