import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  ShoppingCart, 
  Eye, 
  MoreVertical, 
  LogOut,
  ChevronDown,
  User,
  Bell
} from 'lucide-react';
import { logout } from '@/services/authService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3); // Mock count - replace with real data
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      isActive: location.pathname === '/dashboard'
    },
    {
      name: 'Portfolio',
      href: '/portfolio',
      icon: BarChart3,
      isActive: location.pathname === '/portfolio'
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      isActive: location.pathname === '/orders'
    },
    {
      name: 'Watchlist',
      href: '/watchlist',
      icon: Eye,
      isActive: location.pathname === '/watchlist'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:hidden shadow-lg">
      <div className="grid grid-cols-5 h-16 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center space-y-1 px-2 py-2 text-xs font-medium transition-colors cursor-pointer touch-manipulation ${
                item.isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate text-center">{item.name}</span>
            </Link>
          );
        })}
        
        {/* User Menu Dropdown */}
        <div ref={menuRef} className="relative flex flex-col items-center justify-center">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex flex-col items-center justify-center space-y-1 px-2 py-2 text-xs font-medium transition-colors cursor-pointer touch-manipulation text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-5 w-5" />
            <span className="truncate">Menu</span>
          </button>
          
          {userMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/notifications');
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300 relative"
              >
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-auto h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  const event = new CustomEvent('openProfileModal');
                  window.dispatchEvent(event);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;