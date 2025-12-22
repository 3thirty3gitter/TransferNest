'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
// Uses admin layout from src/app/admin/layout.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  ShoppingCart, 
  Mail, 
  Clock, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Send,
  TrendingUp,
  Users,
  Percent,
  Settings,
  Play,
  Zap,
  FileEdit
} from 'lucide-react';
import RecoveryEmailTemplateEditor from '@/components/admin/RecoveryEmailTemplateEditor';
import type { AbandonedCart, AbandonedCartStats, AbandonmentStage } from '@/lib/abandoned-carts';

// Recovery config type
interface RecoveryConfig {
  enabled: boolean;
  email1: { enabled: boolean; delayHours: number; subject: string };
  email2: { enabled: boolean; delayHours: number; subject: string; discountPercent: number; discountValidDays: number };
  email3: { enabled: boolean; delayHours: number; subject: string; discountPercent: number; discountValidDays: number };
  companyName: string;
  supportEmail: string;
  websiteUrl: string;
}

export default function AbandonedCartsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState<AbandonedCartStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<AbandonmentStage | 'all'>('all');
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('carts');
  
  // Recovery config state
  const [recoveryConfig, setRecoveryConfig] = useState<RecoveryConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isRunningRecovery, setIsRunningRecovery] = useState(false);

  // Admin check is handled by src/app/admin/layout.tsx
  // If user gets here, they're already verified as admin

  // Fetch recovery config
  const fetchRecoveryConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const response = await fetch('/api/abandoned-carts/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-config' })
      });
      if (response.ok) {
        const data = await response.json();
        setRecoveryConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch recovery config:', error);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  // Save recovery config
  const saveRecoveryConfig = async () => {
    if (!recoveryConfig) return;
    try {
      setIsSavingConfig(true);
      const response = await fetch('/api/abandoned-carts/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-config', config: recoveryConfig })
      });
      if (response.ok) {
        toast({ title: 'Settings Saved', description: 'Recovery email settings have been updated.' });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Run recovery manually
  const runRecoveryNow = async () => {
    try {
      setIsRunningRecovery(true);
      const response = await fetch('/api/abandoned-carts/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-run' })
      });
      const data = await response.json();
      if (response.ok) {
        toast({ 
          title: 'Recovery Complete', 
          description: `Processed ${data.processed} carts, sent ${data.emailsSent} emails.` 
        });
        fetchData(); // Refresh cart list
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to run recovery', variant: 'destructive' });
    } finally {
      setIsRunningRecovery(false);
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      const token = await user?.getIdToken();
      
      const [cartsRes, statsRes] = await Promise.all([
        fetch('/api/admin/abandoned-carts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/admin/abandoned-carts/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (cartsRes.ok) {
        const cartsData = await cartsRes.json();
        setCarts(cartsData.carts || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch abandoned carts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load abandoned carts data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchRecoveryConfig();
    }
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Send recovery email
  const handleSendRecoveryEmail = async (cart: AbandonedCart, emailType: 'first' | 'second' | 'final') => {
    try {
      const token = await user?.getIdToken();
      
      const response = await fetch('/api/admin/abandoned-carts/send-recovery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          cartId: cart.id,
          emailType
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast({
          title: 'Email Sent',
          description: `Recovery email sent to ${cart.email}`
        });
        // Refresh data in background - don't let errors affect the success toast
        fetchData().catch(console.error);
      } else {
        throw new Error(data.error || data.details || 'Failed to send email');
      }
    } catch (error: any) {
      console.error('Failed to send recovery email:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to send recovery email',
        variant: 'destructive'
      });
    }
  };

  // Filter carts
  const filteredCarts = carts.filter(cart => {
    const matchesSearch = 
      !searchTerm ||
      cart.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || cart.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  // Stage badge color
  const getStageBadge = (stage: AbandonmentStage) => {
    const colors: Record<AbandonmentStage, string> = {
      image_upload: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      nesting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cart: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      checkout: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      payment_failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[stage] || 'bg-gray-500/20 text-gray-400';
  };

  const getStageLabel = (stage: AbandonmentStage) => {
    const labels: Record<AbandonmentStage, string> = {
      image_upload: 'Image Upload',
      nesting: 'Nesting',
      cart: 'Cart',
      checkout: 'Checkout',
      payment_failed: 'Payment Failed'
    };
    return labels[stage] || stage;
  };

  // Format time ago
  const formatTimeAgo = (date: Date | any) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  // Format date for display - handles Firestore Timestamps, Date objects, and ISO strings
  const formatDate = (date: Date | any): string => {
    if (!date) return 'Unknown';
    
    let d: Date;
    
    // Handle Firestore Timestamp (has toDate method - server-side only)
    if (typeof date?.toDate === 'function') {
      d = date.toDate();
    }
    // Handle serialized Firestore Timestamp from JSON (has _seconds property)
    else if (date?._seconds !== undefined) {
      d = new Date(date._seconds * 1000);
    }
    // Handle seconds timestamp format (sometimes Firestore returns this)
    else if (date?.seconds !== undefined) {
      d = new Date(date.seconds * 1000);
    }
    // Handle ISO string or timestamp number
    else {
      d = new Date(date);
    }
    
    // Check if valid date
    if (isNaN(d.getTime())) {
      return 'Invalid Date';
    }
    
    return d.toLocaleString();
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Abandoned Carts</h1>
            <p className="text-muted-foreground">
              Track and recover abandoned orders with automated emails
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={runRecoveryNow} disabled={isRunningRecovery} variant="default">
              <Zap className={`w-4 h-4 mr-2 ${isRunningRecovery ? 'animate-pulse' : ''}`} />
              {isRunningRecovery ? 'Running...' : 'Run Recovery Now'}
            </Button>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="carts">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Abandoned Carts
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Recovery Settings
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileEdit className="w-4 h-4 mr-2" />
              Email Templates
            </TabsTrigger>
          </TabsList>

          {/* Carts Tab */}
          <TabsContent value="carts" className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Abandoned</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Lost Revenue</p>
                    <p className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recovery Rate</p>
                    <p className="text-2xl font-bold">{stats.recoveryRate.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recovered</p>
                    <p className="text-2xl font-bold">{stats.recoveredCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Recovered Value</p>
                    <p className="text-2xl font-bold">${stats.recoveredValue.toFixed(2)}</p>
                  </div>
                  <Percent className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stage Breakdown */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-blue-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStageBadge('nesting')}>Nesting</Badge>
                  <span className="text-lg font-semibold">{stats.byStage.nesting}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Created gang sheet but didn't add to cart
                </p>
              </CardContent>
            </Card>

            <Card className="border-yellow-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStageBadge('cart')}>Cart</Badge>
                  <span className="text-lg font-semibold">{stats.byStage.cart}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Added to cart but didn't checkout
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStageBadge('checkout')}>Checkout</Badge>
                  <span className="text-lg font-semibold">{stats.byStage.checkout}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Started checkout but didn't pay
                </p>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Badge className={getStageBadge('payment_failed')}>Payment Failed</Badge>
                  <span className="text-lg font-semibold">{stats.byStage.payment_failed}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Payment attempt failed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={stageFilter} onValueChange={(v) => setStageFilter(v as any)}>
                <SelectTrigger className="w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="image_upload">Image Upload</SelectItem>
                  <SelectItem value="nesting">Nesting</SelectItem>
                  <SelectItem value="cart">Cart</SelectItem>
                  <SelectItem value="checkout">Checkout</SelectItem>
                  <SelectItem value="payment_failed">Payment Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Carts List */}
        <Card>
          <CardHeader>
            <CardTitle>Abandoned Carts ({filteredCarts.length})</CardTitle>
            <CardDescription>
              Click on a cart to view details and send recovery emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCarts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No abandoned carts found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCarts.map((cart) => (
                  <div
                    key={cart.id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCart(cart)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={getStageBadge(cart.stage)}>
                          {getStageLabel(cart.stage)}
                        </Badge>
                        <div>
                          <p className="font-medium">
                            {cart.email || cart.customerName || 'Anonymous'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {cart.items?.length || 0} items • ${cart.estimatedTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(cart.updatedAt)}
                          </p>
                          {cart.recoveryEmailsSent > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {cart.recoveryEmailsSent} email(s) sent
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cart Detail Dialog */}
        <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedCart && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Badge className={getStageBadge(selectedCart.stage)}>
                      {getStageLabel(selectedCart.stage)}
                    </Badge>
                    Abandoned Cart Details
                  </DialogTitle>
                  <DialogDescription>
                    Session: {selectedCart.sessionId.substring(0, 20)}...
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Customer Info */}
                  <div>
                    <h3 className="font-semibold mb-2">Customer Information</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {selectedCart.email && (
                        <p><span className="text-muted-foreground">Email:</span> {selectedCart.email}</p>
                      )}
                      {selectedCart.customerName && (
                        <p><span className="text-muted-foreground">Name:</span> {selectedCart.customerName}</p>
                      )}
                      {selectedCart.phone && (
                        <p><span className="text-muted-foreground">Phone:</span> {selectedCart.phone}</p>
                      )}
                      {selectedCart.userId && (
                        <p><span className="text-muted-foreground">User ID:</span> {selectedCart.userId}</p>
                      )}
                      {!selectedCart.email && !selectedCart.customerName && (
                        <p className="text-muted-foreground italic">Anonymous user - no contact info</p>
                      )}
                    </div>
                  </div>

                  {/* Cart Items */}
                  <div>
                    <h3 className="font-semibold mb-2">
                      Cart Items ({selectedCart.items?.length || 0})
                    </h3>
                    {selectedCart.items && selectedCart.items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedCart.items.map((item, idx) => (
                          <div key={idx} className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                            {item.thumbnailUrl && (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.sheetSize}" sheet • {item.placedItemsCount} items • {item.utilization?.toFixed(1)}% utilized
                              </p>
                            </div>
                            <p className="font-medium">${item.estimatedPrice.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No items captured</p>
                    )}
                  </div>

                  {/* Stage Details */}
                  {selectedCart.stageDetails && (
                    <div>
                      <h3 className="font-semibold mb-2">Stage Details</h3>
                      <p className="text-sm bg-muted/50 rounded-lg p-3">
                        {selectedCart.stageDetails}
                      </p>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="font-semibold mb-2">Timeline</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {formatDate(selectedCart.createdAt)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Last Activity:</span>{' '}
                        {formatDate(selectedCart.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Recovery Emails */}
                  <div>
                    <h3 className="font-semibold mb-2">Recovery Actions</h3>
                    {selectedCart.recoveryEmailHistory && selectedCart.recoveryEmailHistory.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 mb-4 space-y-2">
                        {selectedCart.recoveryEmailHistory.map((email, idx) => (
                          <p key={idx} className="text-sm">
                            <Badge variant="outline" className="mr-2">{email.templateType}</Badge>
                            Sent {formatDate(email.sentAt)}
                          </p>
                        ))}
                      </div>
                    )}
                    
                    {selectedCart.email && !selectedCart.recovered && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSendRecoveryEmail(selectedCart, 'first')}
                          disabled={selectedCart.recoveryEmailsSent >= 1}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send First Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRecoveryEmail(selectedCart, 'second')}
                          disabled={selectedCart.recoveryEmailsSent < 1 || selectedCart.recoveryEmailsSent >= 2}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Second Email
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendRecoveryEmail(selectedCart, 'final')}
                          disabled={selectedCart.recoveryEmailsSent < 2 || selectedCart.recoveryEmailsSent >= 3}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Final Email
                        </Button>
                      </div>
                    )}
                    
                    {!selectedCart.email && (
                      <p className="text-muted-foreground italic">
                        Cannot send recovery email - no email address captured
                      </p>
                    )}
                    
                    {selectedCart.recovered && (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span>This cart was recovered! Order: {selectedCart.recoveredOrderId}</span>
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Estimated Value</span>
                      <span className="text-2xl font-bold">${selectedCart.estimatedTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {isLoadingConfig ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : recoveryConfig ? (
              <>
                {/* Master Toggle */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Automated Recovery
                    </CardTitle>
                    <CardDescription>
                      Enable automated recovery emails for abandoned carts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="recovery-enabled" className="text-base font-medium">Enable Recovery Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically send recovery emails to customers who abandon their carts
                        </p>
                      </div>
                      <Switch
                        id="recovery-enabled"
                        checked={recoveryConfig.enabled}
                        onCheckedChange={(checked) => setRecoveryConfig({...recoveryConfig, enabled: checked})}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Email 1: Reminder */}
                <Card className={!recoveryConfig.enabled ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email 1: Friendly Reminder
                    </CardTitle>
                    <CardDescription>
                      Sent after the customer abandons their cart (no discount)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable this email</Label>
                      <Switch
                        checked={recoveryConfig.email1.enabled}
                        onCheckedChange={(checked) => setRecoveryConfig({
                          ...recoveryConfig, 
                          email1: {...recoveryConfig.email1, enabled: checked}
                        })}
                        disabled={!recoveryConfig.enabled}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Delay (hours after abandonment)</Label>
                        <Input
                          type="number"
                          value={recoveryConfig.email1.delayHours}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email1: {...recoveryConfig.email1, delayHours: parseInt(e.target.value) || 1}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={recoveryConfig.email1.subject}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email1: {...recoveryConfig.email1, subject: e.target.value}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email 2: Follow-up Reminder */}
                <Card className={!recoveryConfig.enabled ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Email 2: Follow-up Reminder
                    </CardTitle>
                    <CardDescription>
                      A friendly check-in sent 24 hours after the first email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable this email</Label>
                      <Switch
                        checked={recoveryConfig.email2.enabled}
                        onCheckedChange={(checked) => setRecoveryConfig({
                          ...recoveryConfig, 
                          email2: {...recoveryConfig.email2, enabled: checked}
                        })}
                        disabled={!recoveryConfig.enabled}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Delay (hours after Email 1)</Label>
                        <Input
                          type="number"
                          value={recoveryConfig.email2.delayHours}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email2: {...recoveryConfig.email2, delayHours: parseInt(e.target.value) || 24}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={recoveryConfig.email2.subject}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email2: {...recoveryConfig.email2, subject: e.target.value}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email 3: Final Reminder */}
                <Card className={!recoveryConfig.enabled ? 'opacity-50' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Email 3: Final Reminder
                    </CardTitle>
                    <CardDescription>
                      Last friendly reminder before we stop emailing them
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable this email</Label>
                      <Switch
                        checked={recoveryConfig.email3.enabled}
                        onCheckedChange={(checked) => setRecoveryConfig({
                          ...recoveryConfig, 
                          email3: {...recoveryConfig.email3, enabled: checked}
                        })}
                        disabled={!recoveryConfig.enabled}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Delay (hours after Email 2)</Label>
                        <Input
                          type="number"
                          value={recoveryConfig.email3.delayHours}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email3: {...recoveryConfig.email3, delayHours: parseInt(e.target.value) || 72}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                      <div>
                        <Label>Subject Line</Label>
                        <Input
                          value={recoveryConfig.email3.subject}
                          onChange={(e) => setRecoveryConfig({
                            ...recoveryConfig,
                            email3: {...recoveryConfig.email3, subject: e.target.value}
                          })}
                          disabled={!recoveryConfig.enabled}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={saveRecoveryConfig} disabled={isSavingConfig}>
                    {isSavingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  Failed to load recovery settings. Please refresh the page.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <RecoveryEmailTemplateEditor />
          </TabsContent>
        </Tabs>
      </div>
  );
}
