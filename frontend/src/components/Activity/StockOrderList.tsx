import StockOrderItem, { StockOrder } from "./StockOrderItem";

interface StockOrderListProps {
  orders: StockOrder[];
}

const StockOrderList = ({ orders }: StockOrderListProps) => {
  // Group orders by date
  const groupedOrders = orders.reduce((groups, order) => {
    const date = order.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(order);
    return groups;
  }, {} as Record<string, StockOrder[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No orders found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            {formatDate(date)}
          </h3>
          <div className="space-y-2">
            {groupedOrders[date].map((order) => (
              <StockOrderItem key={order.id} order={order} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockOrderList;
