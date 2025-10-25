import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Shield, Zap, BarChart3, Users, Globe, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const LandingPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className={`flex items-center gap-2 transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 animate-bounce">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Campus Exchange</span>
            </div>
            
            <div className={`flex items-center gap-4 transition-all duration-1000 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="group">
                <Link to="/register" className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className={`text-4xl font-bold tracking-tight text-foreground sm:text-6xl transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Trade Stocks Like a Pro
          </h1>
          <p className={`mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Join thousands of students and professionals who are already trading stocks, 
            building portfolios, and learning about the financial markets on Campus Exchange.
          </p>
          <div className={`mt-10 flex items-center justify-center gap-x-6 transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button size="lg" asChild className="group">
              <Link to="/register" className="flex items-center gap-2">
                Start Trading Now
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className={`text-center mb-16 transition-all duration-1000 delay-1200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to trade
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful tools and features designed for modern traders
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '1400ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Real-time Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get live market data, stock prices, and market trends updated in real-time 
                  to make informed trading decisions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '1600ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Secure Trading</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bank-level security with encrypted transactions and secure authentication 
                  to protect your investments and personal data.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '1800ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Lightning Fast</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Execute trades instantly with our high-performance trading engine 
                  and low-latency infrastructure.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '2000ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Community</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect with fellow traders, share strategies, and learn from 
                  experienced investors in our community.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '2200ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Portfolio Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor your investments with detailed analytics, performance metrics, 
                  and portfolio insights.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`} style={{ transitionDelay: '2400ms' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 animate-pulse">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Global Markets</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access stocks from major global exchanges and trade across 
                  different markets and time zones.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className={`text-3xl font-bold tracking-tight text-foreground sm:text-4xl transition-all duration-1000 delay-2600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Ready to start your trading journey?
          </h2>
          <p className={`mt-6 text-lg text-muted-foreground transition-all duration-1000 delay-2800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Join thousands of traders who trust Campus Exchange for their investment needs.
          </p>
          <div className={`mt-10 flex items-center justify-center gap-x-6 transition-all duration-1000 delay-3000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Button size="lg" asChild className="group">
              <Link to="/register" className="flex items-center gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">Campus Exchange</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Campus Exchange. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
