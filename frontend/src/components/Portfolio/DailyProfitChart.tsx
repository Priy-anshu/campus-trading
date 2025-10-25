import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Calendar, Filter } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";

interface DailyProfitData {
  date: string;
  profit: number;
  totalValue: number;
  trades: number;
}

const DailyProfitChart = () => {
  const [data, setData] = useState<DailyProfitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'day' | 'month' | 'year'>('day');

  useEffect(() => {
    fetchDailyProfitData();
  }, [activeFilter]);

  // Auto-refresh every 30 seconds to get latest data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDailyProfitData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeFilter]);

  const fetchDailyProfitData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/portfolio/daily-profit?period=${activeFilter}&limit=30`);
      
      if (response.data && response.data.data) {
        // Ensure data is in the correct format
        const formattedData = response.data.data.map((item: any) => ({
          date: item.date,
          profit: item.profit || 0,
          totalValue: item.totalValue || 0,
          trades: item.trades || 0
        }));
        setData(formattedData);
      } else if (response.data && Array.isArray(response.data)) {
        // Handle case where data is directly in response.data
        const formattedData = response.data.map((item: any) => ({
          date: item.date,
          profit: item.profit || 0,
          totalValue: item.totalValue || 0,
          trades: item.trades || 0
        }));
        setData(formattedData);
      } else {
        setData([]);
      }
    } catch (error) {
      // Silently handle errors
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (filter: string): DailyProfitData[] => {
    // Return empty array to show "No information available"
    return [];
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">
            {activeFilter === 'day' ? formatDate(label) : formatMonth(label)}
          </p>
          <p className={`text-sm font-semibold ${
            data.profit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(data.profit)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Profit/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no data, show a message but still render the chart structure
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Profit/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No profit/loss data available</p>
            <p className="text-sm mt-2">Daily profit/loss resets at midnight IST</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Start trading today to see your daily profit/loss changes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if all data points have 0 profit (new day scenario)
  const allZeroProfit = data.every(item => item.profit === 0);
  
  // Only show special case for truly zero profit scenarios
  if (allZeroProfit && data.length === 1 && data[0].profit === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Profit/Loss
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-4 text-muted-foreground">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">New Day - No trades yet</p>
              <p className="text-xs mt-1">Daily profit/loss resets to 0 at midnight IST</p>
            </div>
            
            {/* Show today's data point */}
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatDate}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="profit" 
                    radius={[4, 4, 0, 0]}
                    fill="#6b7280"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Daily Profit/Loss
        </CardTitle>
        {allZeroProfit && (
          <p className="text-sm text-muted-foreground mt-1">
            New day - Daily profit/loss resets to 0 at midnight IST
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
          
          <TabsContent value="day" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatDate}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="profit" 
                    radius={[4, 4, 0, 0]}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="month" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatMonth}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="profit" 
                    radius={[4, 4, 0, 0]}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DailyProfitChart;
