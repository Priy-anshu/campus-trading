import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import MarketTicker from "@/components/Dashboard/MarketTicker";
import TopMovers from "@/components/Dashboard/TopMovers";
import Leaderboard from "@/components/Dashboard/Leaderboard";
import MostTraded from "@/components/Dashboard/MostTraded";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";

const Dashboard = () => {
  // Auto refresh market data every 15 seconds without page reload
  useAutoRefresh({
    interval: 15000,
    enabled: true,
    onRefresh: () => {
      // Components will handle their own data refresh
      // No page reload needed
    }
  });


  return (
        <div className="min-h-screen bg-background">
          <Navbar />
          
            <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8 pb-20 md:pb-8 lg:px-8 space-y-6 sm:space-y-8 animate-fade-in">
        {/* Market Ticker */}
        <section>
          <MarketTicker />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Top Movers and Most Traded */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <TopMovers />
            <MostTraded />
          </div>

          {/* Right Column - Leaderboard Sidebar */}
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
