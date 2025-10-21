import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, FileText, BarChart3, PieChart, Zap, Shield } from "lucide-react";

interface ProductTool {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  description: string;
}

const ProductTools = () => {
  const tools: ProductTool[] = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "IPO",
      badge: "5 open",
      description: "Invest in upcoming IPOs"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Bonds",
      description: "Fixed income investments"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "ETF Screener",
      description: "Find the right ETFs"
    },
    {
      icon: <PieChart className="h-5 w-5" />,
      label: "Mutual Funds",
      badge: "New",
      description: "Diversified portfolios"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: "F&O",
      description: "Futures & Options"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: "Insurance",
      description: "Protect your wealth"
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products & Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.label}
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-all hover:scale-[1.02] cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {tool.icon}
              </div>
              <div>
                <p className="font-medium text-foreground">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </div>
            {tool.badge && (
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20 hover:bg-success/20">
                {tool.badge}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProductTools;
