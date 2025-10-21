import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import FiltersPanel from "@/components/Activity/FiltersPanel";
import StockOrderList from "@/components/Activity/StockOrderList";
import { StockOrder } from "@/components/Activity/StockOrderItem";
import Loader from "@/components/Dashboard/Loader";
import ErrorCard from "@/components/Dashboard/ErrorCard";
import { ENDPOINTS, apiClient } from "@/api/config";

// No mock data; show real orders or an empty state

const StockActivityHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<StockOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showBuyOrders, setShowBuyOrders] = useState(true);
  const [showSellOrders, setShowSellOrders] = useState(true);
  const [showCompletedOrders, setShowCompletedOrders] = useState(true);

  // Load user's orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        // If you add an orders endpoint later, plug it here:
        // const { data } = await apiClient.get(`${ENDPOINTS.portfolio}/orders`);
        // setOrders(Array.isArray(data) ? data : []);
        setOrders([]);
        setError(false);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Date range filter
    if (fromDate) {
      filtered = filtered.filter(order => new Date(order.date) >= new Date(fromDate));
    }
    if (toDate) {
      filtered = filtered.filter(order => new Date(order.date) <= new Date(toDate));
    }

    // Order type filter
    const allowedTypes = [];
    if (showBuyOrders) allowedTypes.push("BUY");
    if (showSellOrders) allowedTypes.push("SELL");
    if (allowedTypes.length > 0) {
      filtered = filtered.filter(order => allowedTypes.includes(order.type));
    } else {
      filtered = [];
    }

    // Status filter
    if (showCompletedOrders) {
      // Show all orders including completed
    } else {
      // Exclude completed orders
      filtered = filtered.filter(order => order.status !== "COMPLETED");
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, fromDate, toDate, showBuyOrders, showSellOrders, showCompletedOrders]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">My Stock Activity</h1>
          <p className="text-muted-foreground mt-1">View your complete trading history</p>
        </div>

        {isLoading ? (
          <Loader />
        ) : error ? (
          <ErrorCard message="Failed to load order history. Please try again." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Panel - Left Side */}
            <div className="lg:col-span-1">
              <FiltersPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                showBuyOrders={showBuyOrders}
                showSellOrders={showSellOrders}
                showCompletedOrders={showCompletedOrders}
                onBuyOrdersChange={setShowBuyOrders}
                onSellOrdersChange={setShowSellOrders}
                onCompletedOrdersChange={setShowCompletedOrders}
              />
            </div>

            {/* Order List - Right Side */}
            <div className="lg:col-span-3">
              {filteredOrders.length === 0 ? (
                <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
                  No orders yet. Your transactions will appear here after you buy or sell.
                </div>
              ) : (
                <StockOrderList orders={filteredOrders} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockActivityHistory;


// import { useState, useEffect } from "react";
// import { ArrowLeft, RefreshCw } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "@/components/Navbar";
// import FiltersPanel from "@/components/Activity/FiltersPanel";
// import StockOrderList from "@/components/Activity/StockOrderList";
// import { StockOrder } from "@/components/Activity/StockOrderItem"; // Keep this import
// import Loader from "@/components/Dashboard/Loader";
// import ErrorCard from "@/components/Dashboard/ErrorCard";
// import { ENDPOINTS, apiClient } from "@/api/config";

// // Removed duplicate StockOrder type definition - using the imported one instead

// const StockActivityHistory = () => {
//   const navigate = useNavigate();
//   const [orders, setOrders] = useState<StockOrder[]>([]); // Using imported type
//   const [filteredOrders, setFilteredOrders] = useState<StockOrder[]>([]); // Using imported type
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [refreshKey, setRefreshKey] = useState(0);

//   // Filter states
//   const [searchQuery, setSearchQuery] = useState("");
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [showBuyOrders, setShowBuyOrders] = useState(true);
//   const [showSellOrders, setShowSellOrders] = useState(true);
//   const [showCompletedOrders, setShowCompletedOrders] = useState(true);

//   // Load user's orders
//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         setIsLoading(true);
//         setError(null);
        
//         const token = localStorage.getItem("token");
//         const { data } = await apiClient.get(`${ENDPOINTS.portfolio}/orders`, {
//           headers: token ? { Authorization: `Bearer ${token}` } : {},
//         });
        
//         setOrders(Array.isArray(data) ? data : []);
//       } catch (err) {
//         console.error("Failed to fetch orders:", err);
//         setError("Failed to load order history. Please try again.");
//         setOrders([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchOrders();
//   }, [refreshKey]);

//   // Apply filters
//   useEffect(() => {
//     let filtered = [...orders];

//     // Search filter
//     if (searchQuery) {
//       filtered = filtered.filter(order =>
//         order.stockName.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         order.symbol.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//     }

//     // Date range filter
//     if (fromDate) {
//       filtered = filtered.filter(order => new Date(order.date) >= new Date(fromDate));
//     }
//     if (toDate) {
//       filtered = filtered.filter(order => new Date(order.date) <= new Date(toDate));
//     }

//     // Order type filter
//     const allowedTypes = [];
//     if (showBuyOrders) allowedTypes.push("BUY");
//     if (showSellOrders) allowedTypes.push("SELL");
//     if (allowedTypes.length > 0) {
//       filtered = filtered.filter(order => allowedTypes.includes(order.type));
//     } else {
//       filtered = [];
//     }

//     // Status filter
//     if (!showCompletedOrders) {
//       filtered = filtered.filter(order => order.status !== "COMPLETED");
//     }

//     setFilteredOrders(filtered);
//   }, [orders, searchQuery, fromDate, toDate, showBuyOrders, showSellOrders, showCompletedOrders]);

//   const handleRefresh = () => {
//     setRefreshKey(prev => prev + 1);
//   };

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
      
//       <div className="container mx-auto px-4 py-6 max-w-7xl">
//         {/* Header */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between mb-4">
//             <button
//               onClick={() => navigate(-1)}
//               className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
//             >
//               <ArrowLeft className="h-4 w-4" />
//               Back
//             </button>
            
//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
//               disabled={isLoading}
//             >
//               <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
//               Refresh
//             </button>
//           </div>
          
//           <h1 className="text-3xl font-bold">My Stock Activity</h1>
//           <p className="text-muted-foreground mt-1">View your complete trading history</p>
//         </div>

//         {isLoading ? (
//           <Loader />
//         ) : error ? (
//           <ErrorCard message={error} />
//         ) : (
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//             {/* Filters Panel */}
//             <div className="lg:col-span-1">
//               <FiltersPanel
//                 searchQuery={searchQuery}
//                 onSearchChange={setSearchQuery}
//                 fromDate={fromDate}
//                 toDate={toDate}
//                 onFromDateChange={setFromDate}
//                 onToDateChange={setToDate}
//                 showBuyOrders={showBuyOrders}
//                 showSellOrders={showSellOrders}
//                 showCompletedOrders={showCompletedOrders}
//                 onBuyOrdersChange={setShowBuyOrders}
//                 onSellOrdersChange={setShowSellOrders}
//                 onCompletedOrdersChange={setShowCompletedOrders}
//               />
//             </div>

//             {/* Order List */}
//             <div className="lg:col-span-3">
//               {filteredOrders.length === 0 ? (
//                 <div className="rounded-md border border-border p-6 text-sm text-muted-foreground">
//                   {orders.length === 0 ? 
//                     "No orders found. Your transactions will appear here after you buy or sell." :
//                     "No orders match your current filters. Try adjusting your filter criteria."
//                   }
//                 </div>
//               ) : (
//                 <StockOrderList orders={filteredOrders} />
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StockActivityHistory;