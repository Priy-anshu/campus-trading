import { useState } from "react";
import Navbar from "@/components/Navbar";
import HoldingsDashboard from "@/components/Holdings/HoldingsDashboard";
import WatchlistDashboard from "@/components/WatchList/WatchlistDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [activeTab, setActiveTab] = useState("holdings");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>
          
          <TabsContent value="holdings" className="mt-0">
            <HoldingsDashboard />
          </TabsContent>
          
          <TabsContent value="watchlist" className="mt-0">
            <WatchlistDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
