import { formatCurrency } from "@/utils/formatCurrency";

export interface StockOrder {
  id: string;
  stockName: string;
  symbol: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string;
  time: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
}

interface StockOrderItemProps {
  order: StockOrder;
}

const StockOrderItem = ({ order }: StockOrderItemProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500";
      case "PENDING":
        return "bg-orange-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "BUY" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-all">
      <div className="flex items-center gap-4 flex-1">
        {/* Status Indicator */}
        <div className={`h-2.5 w-2.5 rounded-full ${getStatusColor(order.status)}`} />

        {/* Stock Details */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <p className="font-medium text-foreground">{order.stockName}</p>
            <span className={`text-sm font-semibold ${getTypeColor(order.type)}`}>
              {order.type}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{order.symbol}</p>
        </div>

        {/* Quantity */}
        <div className="text-right min-w-[80px]">
          <p className="text-sm text-muted-foreground">Qty</p>
          <p className="font-medium">{order.quantity}</p>
        </div>

        {/* Price */}
        <div className="text-right min-w-[100px]">
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="font-medium">{formatCurrency(order.price)}</p>
        </div>

        {/* Total */}
        <div className="text-right min-w-[120px]">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="font-semibold">{formatCurrency(order.price * order.quantity)}</p>
        </div>

        {/* Time */}
        <div className="text-right min-w-[80px]">
          <p className="text-xs text-muted-foreground">{order.time}</p>
        </div>
      </div>
    </div>
  );
};

export default StockOrderItem;
