import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/Dashboard/MarketTicker";
import TopMovers from "@/components/Dashboard/TopMovers";
import ProductionTools from "@/components/Dashboard/ProductionTools";
import MostTraded from "@/components/Dashboard/MostTraded";
import InvestmentSummary from "@/components/Dashboard/InvestmentSummary";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

const Dashboard = () => {
  // Auto refresh market data every 60 seconds
  useAutoRefresh({
    interval: 60000,
    enabled: true,
    onRefresh: () => {
      // Trigger a page refresh to get latest data
      window.location.reload();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
        {/* Market Ticker */}
        <section>
          <MarketTicker />
        </section>

        {/* Investment Summary */}
        <section>
          <InvestmentSummary />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Top Movers and Most Traded */}
          <div className="lg:col-span-2 space-y-8">
            <TopMovers />
            <MostTraded />
          </div>

          {/* Right Column - Products & Tools Sidebar */}
          <div className="lg:col-span-1">
            <ProductionTools />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
