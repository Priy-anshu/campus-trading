import { TrendingUp, Search, /* Bell, */ MoreVertical, LogOut, ChevronDown, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { logout } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, apiClient } from "@/api/config";
import ProfileModal from "./ProfileModal";
import MobileBottomNav from "./MobileBottomNav";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<number | undefined>(undefined);
  
  const isActive = (path: string) => location.pathname === path;
  
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of your account.",
    });
    navigate('/login');
  };

  const toNumber = (val: any) => {
    const s = String(val ?? '').replace(/,/g, '').trim();
    const n = parseFloat(s);
    return Number.isNaN(n) ? 0 : n;
  };

  useEffect(() => {
    window.addEventListener('click', (e) => {
      if (!inputRef.current) return;
      if (!(e.target as HTMLElement).closest('#global-search') && !(e.target as HTMLElement).closest('#mobile-search')) setOpen(false);
      if (!(e.target as HTMLElement).closest('#user-menu')) setUserMenuOpen(false);
    });

    // Listen for profile modal open event from mobile bottom nav
    const handleOpenProfileModal = () => {
      setProfileModalOpen(true);
    };

    window.addEventListener('openProfileModal', handleOpenProfileModal);
    
    return () => {
      window.removeEventListener('openProfileModal', handleOpenProfileModal);
    };
  }, []);

  const onSearchChange = (val: string) => {
    setQuery(val);
    setOpen(!!val);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(async () => {
      if (!val) return setResults([]);
      try {
        const { data } = await apiClient.get(ENDPOINTS.stockSearch, { params: { symbol: val } });
        const normalized = (Array.isArray(data) ? data : []).slice(0, 8).map((it: any) => ({
          symbol: it.symbol,
          name: it.companyName || it.name || it.symbol,
          price: toNumber(it.price ?? it.lastPrice ?? it.ltp),
        }));
        setResults(normalized);
      } catch (err) {
        setResults([]);
      }
    }, 300);
  };

  const goToSymbol = (sym: string) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    navigate(`/stock/${sym}`);
  };
  
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Campus Trading</span>
          </Link>
          
          {/* Mobile Search Bar - Visible only on mobile */}
          <div className="md:hidden flex-1 max-w-sm ml-4 mr-2">
            <div id="mobile-search" className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search stocks..."
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring focus:border-ring shadow-sm"
              />
              {open && (
                <div className="absolute left-0 top-11 w-full max-w-sm rounded-lg border border-border bg-popover shadow-lg z-50 max-h-80 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((r) => (
                      <button
                        key={r.symbol}
                        onClick={() => goToSymbol(r.symbol)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-muted flex items-center justify-between border-b border-border last:border-b-0"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium text-foreground">{r.symbol}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-32">{r.name}</span>
                        </div>
                        <span className="text-sm font-medium text-primary">₹{r.price.toLocaleString('en-IN')}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      No stocks found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Desktop Navigation Links - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/dashboard') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/portfolio" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/portfolio') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Portfolio
            </Link>
            <Link 
              to="/orders" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/orders') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Orders
            </Link>
            <Link 
              to="/watchlist" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive('/watchlist') ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              Watchlist
            </Link>
          </div>
            
          {/* Desktop Search and Actions - Hidden on Mobile */}
          <div className="hidden md:flex items-center gap-2 relative">
            <div id="global-search" className="ml-4 flex items-center gap-2 relative">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search stocks..."
                  className="h-9 w-56 rounded-md border border-input bg-background pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {open && (
                <div className="absolute left-0 top-10 w-[260px] rounded-md border border-border bg-popover shadow-md z-50">
                  {results.length > 0 ? (
                    results.map((r) => (
                      <button
                        key={r.symbol}
                        onClick={() => goToSymbol(r.symbol)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center justify-between"
                      >
                        <span className="truncate mr-2">{r.symbol} — {r.name}</span>
                        <span className="text-muted-foreground">₹{r.price.toLocaleString('en-IN')}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      No stocks found
                    </div>
                  )}
                </div>
              )}
              
                  {/* <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Bell className="h-4 w-4" />
                  </Button> */}
              <div id="user-menu" className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  title="User Menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-48 rounded-md border border-border bg-popover shadow-md z-50">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProfileModal 
        isOpen={profileModalOpen} 
        onClose={() => setProfileModalOpen(false)} 
      />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </nav>
  );
};

export default Navbar;
