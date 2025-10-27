import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Phone, Calendar, Users, Mail, Wallet, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ENDPOINTS, apiClient } from "@/api/config";
import { useTheme } from "@/contexts/ThemeContext";
import { usePortfolio } from "@/hooks/usePortfolio";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  walletBalance: number;
  totalProfit: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { portfolioData } = usePortfolio();

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(ENDPOINTS.me);
      setProfile(data);
    } catch (error) {
      // Silently handle errors
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch profile data',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
      // Removed auto-refresh - profile data only loads on modal open
    }
  }, [isOpen]);

  // Update profile data when portfolio data changes (after buy/sell transactions)
  useEffect(() => {
    if (profile && portfolioData) {
      setProfile(prev => prev ? {
        ...prev,
        walletBalance: portfolioData.walletBalance || prev.walletBalance,
        totalProfit: portfolioData.totalProfit || prev.totalProfit
      } : prev);
    }
  }, [portfolioData]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password must be at least 6 characters long',
      });
      return;
    }

    setChangingPassword(true);
    try {
      await apiClient.post(ENDPOINTS.changePassword, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      toast({
        title: 'Password changed successfully',
        description: 'Your password has been updated',
      });

      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to change password',
        description: error.response?.data?.message || 'An error occurred',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Loading your profile information...</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Profile</DialogTitle>
          <DialogDescription>View and manage your profile settings</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {profile ? (
              <div className="space-y-4">
                {/* Theme Toggle Card - At the Top */}
                <Card>
                  <CardContent className="py-2">
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={toggleTheme}
                        className="flex items-center gap-2"
                      >
                        {theme === 'light' ? (
                          <>
                            <Moon className="h-4 w-4" />
                            Switch to Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="h-4 w-4" />
                            Switch to Light Mode
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Name</Label>
                        <p className="text-sm font-medium truncate">{profile.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Username</Label>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{profile.username || 'Not specified'}</p>
                          {profile.username && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              @{profile.username}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm font-medium flex items-center gap-2 truncate">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{profile.email || 'Not specified'}</span>
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Mobile</Label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {profile.mobileNumber || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Date of Birth</Label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {profile.dateOfBirth ? formatDate(profile.dateOfBirth) : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4" />
                      Trading Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Wallet Balance</Label>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(profile.walletBalance || 0)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground">Total Profit</Label>
                        <p className={`text-lg font-bold ${
                          (profile.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(profile.totalProfit || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading profile information...</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={changingPassword}
                    className="w-full"
                  >
                    {changingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
