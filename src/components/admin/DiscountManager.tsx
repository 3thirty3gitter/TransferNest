'use client';

import { useState, useEffect } from 'react';
import { 
  DiscountCode, 
  DiscountType,
  getAllDiscounts, 
  createDiscount, 
  updateDiscount, 
  deleteDiscount,
  toggleDiscountStatus,
  generateRandomCode,
  codeExists
} from '@/lib/discounts';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Timestamp } from 'firebase/firestore';
import {
  Tag,
  Plus,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  Search,
  Percent,
  DollarSign,
  Truck,
  Calendar,
  Users,
  ShoppingCart,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface DiscountManagerProps {
  adminUserId: string;
}

export default function DiscountManager({ adminUserId }: DiscountManagerProps) {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Partial<DiscountCode> | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load discounts
  useEffect(() => {
    loadDiscounts();
  }, []);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await getAllDiscounts();
      setDiscounts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load discounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter discounts
  const filteredDiscounts = discounts.filter(d => {
    const matchesSearch = 
      d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = showInactive || d.isActive;
    return matchesSearch && matchesActive;
  });

  // Create new discount
  const handleCreate = () => {
    setEditingDiscount({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      isActive: true,
      firstOrderOnly: false,
      combinable: true,
      excludeSaleItems: false,
      createdBy: adminUserId
    });
    setIsEditing(true);
  };

  // Edit existing discount
  const handleEdit = (discount: DiscountCode) => {
    setEditingDiscount({ ...discount });
    setIsEditing(true);
  };

  // Save discount
  const handleSave = async () => {
    if (!editingDiscount) return;
    
    // Validation
    if (!editingDiscount.code?.trim()) {
      toast({ title: 'Error', description: 'Discount code is required', variant: 'destructive' });
      return;
    }
    if (!editingDiscount.description?.trim()) {
      toast({ title: 'Error', description: 'Description is required', variant: 'destructive' });
      return;
    }
    if (editingDiscount.type !== 'free_shipping' && (!editingDiscount.value || editingDiscount.value <= 0)) {
      toast({ title: 'Error', description: 'Discount value must be greater than 0', variant: 'destructive' });
      return;
    }
    if (editingDiscount.type === 'percentage' && editingDiscount.value! > 100) {
      toast({ title: 'Error', description: 'Percentage cannot exceed 100%', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Check if code exists (for new discounts)
      if (!editingDiscount.id) {
        const exists = await codeExists(editingDiscount.code!);
        if (exists) {
          toast({ title: 'Error', description: 'This discount code already exists', variant: 'destructive' });
          setSaving(false);
          return;
        }
      }

      if (editingDiscount.id) {
        // Update existing
        await updateDiscount(editingDiscount.id, editingDiscount);
        toast({ title: 'Success', description: 'Discount updated successfully' });
      } else {
        // Create new
        await createDiscount(editingDiscount as any);
        toast({ title: 'Success', description: 'Discount created successfully' });
      }

      await loadDiscounts();
      setIsEditing(false);
      setEditingDiscount(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save discount', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // Delete discount
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    
    try {
      await deleteDiscount(id);
      toast({ title: 'Success', description: 'Discount deleted' });
      await loadDiscounts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete discount', variant: 'destructive' });
    }
  };

  // Toggle active status
  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleDiscountStatus(id, isActive);
      setDiscounts(prev => prev.map(d => 
        d.id === id ? { ...d, isActive } : d
      ));
      toast({ 
        title: isActive ? 'Activated' : 'Deactivated', 
        description: `Discount ${isActive ? 'activated' : 'deactivated'}` 
      });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  // Copy code to clipboard
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` });
  };

  // Generate random code
  const handleGenerateCode = async () => {
    let code = generateRandomCode();
    // Make sure it's unique
    while (await codeExists(code)) {
      code = generateRandomCode();
    }
    setEditingDiscount(prev => prev ? { ...prev, code } : null);
  };

  // Format date for input
  const formatDateForInput = (timestamp?: Timestamp): string => {
    if (!timestamp) return '';
    return timestamp.toDate().toISOString().slice(0, 16);
  };

  // Parse date from input
  const parseDateFromInput = (value: string): Timestamp | undefined => {
    if (!value) return undefined;
    return Timestamp.fromDate(new Date(value));
  };

  // Get discount type icon
  const getTypeIcon = (type: DiscountType) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed': return <DollarSign className="h-4 w-4" />;
      case 'free_shipping': return <Truck className="h-4 w-4" />;
    }
  };

  // Format discount value display
  const formatDiscountValue = (discount: DiscountCode) => {
    switch (discount.type) {
      case 'percentage': return `${discount.value}% OFF`;
      case 'fixed': return `$${discount.value.toFixed(2)} OFF`;
      case 'free_shipping': return 'FREE SHIPPING';
    }
  };

  // Check if discount is expired
  const isExpired = (discount: DiscountCode): boolean => {
    if (!discount.endDate) return false;
    return discount.endDate.toMillis() < Date.now();
  };

  // Check if discount is not yet active
  const isNotYetActive = (discount: DiscountCode): boolean => {
    if (!discount.startDate) return false;
    return discount.startDate.toMillis() > Date.now();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="h-6 w-6" />
            Discount Codes
          </h2>
          <button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Discount
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by code or description..."
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
              id="show-inactive"
            />
            <Label htmlFor="show-inactive" className="text-slate-300 cursor-pointer">
              Show inactive
            </Label>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-strong rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Discounts</p>
              <p className="text-2xl font-bold text-white">
                {discounts.filter(d => d.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Uses</p>
              <p className="text-2xl font-bold text-white">
                {discounts.reduce((sum, d) => sum + d.currentUses, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Savings Given</p>
              <p className="text-2xl font-bold text-white">
                ${discounts.reduce((sum, d) => sum + d.totalSavingsGiven, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Discounts List */}
      <div className="space-y-3">
        {filteredDiscounts.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
            <Tag className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">
              {searchTerm ? 'No discounts found matching your search' : 'No discounts created yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
              >
                Create your first discount
              </button>
            )}
          </div>
        ) : (
          filteredDiscounts.map(discount => (
            <div
              key={discount.id}
              className={`glass-strong rounded-xl p-4 border transition-all ${
                discount.isActive 
                  ? 'border-white/10 hover:border-white/20' 
                  : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Left: Code and Description */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-3 py-1 bg-blue-500/20 rounded-lg text-blue-300 font-mono font-bold">
                      {discount.code}
                    </span>
                    <button
                      onClick={() => copyCode(discount.code)}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      discount.type === 'percentage' ? 'bg-purple-500/20 text-purple-300' :
                      discount.type === 'fixed' ? 'bg-green-500/20 text-green-300' :
                      'bg-cyan-500/20 text-cyan-300'
                    }`}>
                      {getTypeIcon(discount.type)}
                      <span className="ml-1">{formatDiscountValue(discount)}</span>
                    </span>
                    
                    {/* Status badges */}
                    {isExpired(discount) && (
                      <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300">
                        Expired
                      </span>
                    )}
                    {isNotYetActive(discount) && (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300">
                        Scheduled
                      </span>
                    )}
                    {discount.maxUses && discount.currentUses >= discount.maxUses && (
                      <span className="px-2 py-0.5 rounded text-xs bg-orange-500/20 text-orange-300">
                        Limit Reached
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm">{discount.description}</p>
                  
                  {/* Conditions */}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-500">
                    {discount.minimumOrderAmount && (
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        Min ${discount.minimumOrderAmount}
                      </span>
                    )}
                    {discount.maxUses && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {discount.currentUses}/{discount.maxUses} uses
                      </span>
                    )}
                    {discount.firstOrderOnly && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        First order only
                      </span>
                    )}
                    {discount.endDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires {discount.endDate.toDate().toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Stats and Actions */}
                <div className="flex items-center gap-4">
                  {/* Stats */}
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500">Total Savings</p>
                    <p className="text-lg font-bold text-white">
                      ${discount.totalSavingsGiven.toFixed(2)}
                    </p>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={discount.isActive}
                      onCheckedChange={(checked) => handleToggle(discount.id, checked)}
                    />
                    {discount.isActive ? (
                      <Eye className="h-4 w-4 text-green-400" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      {isEditing && editingDiscount && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {editingDiscount.id ? 'Edit Discount' : 'Create New Discount'}
              </h3>
              <button
                onClick={() => { setIsEditing(false); setEditingDiscount(null); }}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Code and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-200">Discount Code *</Label>
                  <div className="flex gap-2">
                    <Input
                      value={editingDiscount.code || ''}
                      onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SAVE10"
                      className="bg-white/10 border-white/20 text-white font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300"
                      title="Generate random code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-200">Discount Type *</Label>
                  <select
                    value={editingDiscount.type || 'percentage'}
                    onChange={(e) => setEditingDiscount({ 
                      ...editingDiscount, 
                      type: e.target.value as DiscountType,
                      value: e.target.value === 'free_shipping' ? 0 : editingDiscount.value
                    })}
                    className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-md text-white"
                  >
                    <option value="percentage">Percentage Off</option>
                    <option value="fixed">Fixed Amount Off</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label className="text-slate-200">Description *</Label>
                <Input
                  value={editingDiscount.description || ''}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, description: e.target.value })}
                  placeholder="Internal description for this discount"
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              {/* Value */}
              {editingDiscount.type !== 'free_shipping' && (
                <div>
                  <Label className="text-slate-200">
                    {editingDiscount.type === 'percentage' ? 'Percentage Off (%)' : 'Amount Off ($)'} *
                  </Label>
                  <div className="relative">
                    {editingDiscount.type === 'fixed' && (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    )}
                    <Input
                      type="number"
                      min="0"
                      max={editingDiscount.type === 'percentage' ? 100 : undefined}
                      step={editingDiscount.type === 'percentage' ? 1 : 0.01}
                      value={editingDiscount.value || ''}
                      onChange={(e) => setEditingDiscount({ ...editingDiscount, value: parseFloat(e.target.value) || 0 })}
                      placeholder={editingDiscount.type === 'percentage' ? '10' : '5.00'}
                      className={`bg-white/10 border-white/20 text-white ${
                        editingDiscount.type === 'fixed' ? 'pl-8' : ''
                      }`}
                    />
                    {editingDiscount.type === 'percentage' && (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>
              )}

              {/* Conditions Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Conditions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Minimum Order Amount ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingDiscount.minimumOrderAmount || ''}
                        onChange={(e) => setEditingDiscount({ 
                          ...editingDiscount, 
                          minimumOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                        })}
                        placeholder="No minimum"
                        className="pl-8 bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-200">Minimum Quantity</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingDiscount.minimumQuantity || ''}
                      onChange={(e) => setEditingDiscount({ 
                        ...editingDiscount, 
                        minimumQuantity: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="No minimum"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Usage Limits Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Usage Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Total Uses Allowed</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingDiscount.maxUses || ''}
                      onChange={(e) => setEditingDiscount({ 
                        ...editingDiscount, 
                        maxUses: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="Unlimited"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-200">Uses Per Customer</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editingDiscount.maxUsesPerCustomer || ''}
                      onChange={(e) => setEditingDiscount({ 
                        ...editingDiscount, 
                        maxUsesPerCustomer: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      placeholder="Unlimited"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Date Range Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Validity Period
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={formatDateForInput(editingDiscount.startDate as Timestamp | undefined)}
                      onChange={(e) => setEditingDiscount({ 
                        ...editingDiscount, 
                        startDate: parseDateFromInput(e.target.value) 
                      })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-slate-200">End Date</Label>
                    <Input
                      type="datetime-local"
                      value={formatDateForInput(editingDiscount.endDate as Timestamp | undefined)}
                      onChange={(e) => setEditingDiscount({ 
                        ...editingDiscount, 
                        endDate: parseDateFromInput(e.target.value) 
                      })}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Options Section */}
              <div className="border-t border-white/10 pt-6">
                <h4 className="text-lg font-semibold text-white mb-4">Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">First Order Only</p>
                      <p className="text-sm text-slate-400">Only allow for customers with no previous orders</p>
                    </div>
                    <Switch
                      checked={editingDiscount.firstOrderOnly || false}
                      onCheckedChange={(checked) => setEditingDiscount({ ...editingDiscount, firstOrderOnly: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">Active</p>
                      <p className="text-sm text-slate-400">Enable this discount code</p>
                    </div>
                    <Switch
                      checked={editingDiscount.isActive ?? true}
                      onCheckedChange={(checked) => setEditingDiscount({ ...editingDiscount, isActive: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-4 flex justify-end gap-3">
              <button
                onClick={() => { setIsEditing(false); setEditingDiscount(null); }}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {editingDiscount.id ? 'Update Discount' : 'Create Discount'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
