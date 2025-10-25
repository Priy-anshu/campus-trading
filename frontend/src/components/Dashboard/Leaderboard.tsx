import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown, TrendingUp } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";

interface LeaderboardEntry {
  rank?: number;
  username?: string;
  name?: string;
  totalProfit?: number;
  userId?: string;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<{
    day: LeaderboardEntry[];
    month: LeaderboardEntry[];
    overall: LeaderboardEntry[];
  }>({
    day: [],
    month: [],
    overall: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("day");

  const fetchLeaderboard = async (period: string) => {
    try {
      const { data } = await apiClient.get(ENDPOINTS.leaderboard, {
        params: { period }
      });
      return data.data || [];
    } catch (error) {
      return [];
    }
  };

  const loadAllLeaderboards = async () => {
    setLoading(true);
    try {
      const [dayData, monthData, overallData] = await Promise.all([
        fetchLeaderboard('day'),
        fetchLeaderboard('month'),
        fetchLeaderboard('overall')
      ]);

      setLeaderboardData({
        day: dayData,
        month: monthData,
        overall: overallData
      });
    } catch (error) {
      // Silently handle errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllLeaderboards();
    
    // Refresh leaderboard data every 30 seconds
    const interval = setInterval(loadAllLeaderboards, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    if (rank <= 10) return "outline";
    return "outline";
  };

  const formatProfit = (profit: number | undefined) => {
    if (profit === undefined || profit === null) {
      return "₹0.00";
    }
    const isPositive = profit >= 0;
    const sign = isPositive ? "+" : "";
    return `${sign}₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const currentData = leaderboardData[activeTab as keyof typeof leaderboardData] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="overall">Overall</TabsTrigger>
          </TabsList>
          
          <TabsContent value="day" className="mt-4">
            <LeaderboardContent 
              data={currentData} 
              loading={loading}
              period="day"
            />
          </TabsContent>
          
          <TabsContent value="month" className="mt-4">
            <LeaderboardContent 
              data={currentData} 
              loading={loading}
              period="month"
            />
          </TabsContent>
          
          <TabsContent value="overall" className="mt-4">
            <LeaderboardContent 
              data={currentData} 
              loading={loading}
              period="overall"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface LeaderboardContentProps {
  data: LeaderboardEntry[];
  loading: boolean;
  period: string;
}

const LeaderboardContent = ({ data, loading, period }: LeaderboardContentProps) => {
  const getRankIcon = (rank: number | undefined) => {
    const rankNum = rank || 0;
    switch (rankNum) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getRankBadgeVariant = (rank: number | undefined) => {
    const rankNum = rank || 0;
    if (rankNum === 1) return "default";
    if (rankNum <= 3) return "secondary";
    if (rankNum <= 10) return "outline";
    return "outline";
  };

  const formatProfit = (profit: number | undefined) => {
    if (profit === undefined || profit === null) {
      return "₹0.00";
    }
    const isPositive = profit >= 0;
    const sign = isPositive ? "+" : "";
    return `${sign}₹${profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border animate-pulse">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted"></div>
              <div className="space-y-1">
                <div className="h-4 w-20 bg-muted rounded"></div>
                <div className="h-3 w-16 bg-muted rounded"></div>
              </div>
            </div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No data available for {period} leaderboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 20).map((entry, index) => (
        <div
          key={`${entry.userId || 'unknown'}-${entry.rank || index}`}
          className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-accent/50 ${
            (entry.rank || 0) <= 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getRankIcon(entry.rank)}
              <Badge 
                variant={getRankBadgeVariant(entry.rank)}
                className="text-xs font-bold"
              >
                #{entry.rank || '--'}
              </Badge>
            </div>
            <div>
              <p className="font-medium text-foreground">{entry.username || 'Unknown'}</p>
              <p className="text-xs text-muted-foreground">{entry.name || 'Unknown User'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-semibold ${
              (entry.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatProfit(entry.totalProfit)}
            </p>
          </div>
        </div>
      ))}
      
      {data.length > 20 && (
        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground">
            Showing top 20 of {data.length} traders
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
