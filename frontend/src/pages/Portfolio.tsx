import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import HoldingsDashboard from "@/components/Holdings/HoldingsDashboard";
import DailyProfitChart from "@/components/Portfolio/DailyProfitChart";
import LoadingIndicator from "@/components/LoadingIndicator";
import { useState } from "react";

const Portfolio = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LoadingIndicator isLoading={isLoading} timeout={5000}>
      <div className="min-h-screen bg-background">
        <Navbar />
        
          <main className="mx-auto max-w-7xl px-4 py-8 pb-20 md:pb-8 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
          {/* Holdings Section */}
          <section>
            <HoldingsDashboard />
          </section>

          {/* Daily Profit/Loss Chart */}
          <section>
            <DailyProfitChart />
          </section>
        </main>
      </div>
    </LoadingIndicator>
  );
};

export default Portfolio;
