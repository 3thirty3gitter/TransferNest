'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { checkAdminAccess } from '@/middleware/adminAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit2, Trash2, DollarSign, Package, Sparkles, Wand2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  sheetSize: '13' | '17';
  pricePerInch: number;
  basePrice: number;
  isActive: boolean;
  badge?: string;
  badgeColor?: string;
  gradient?: string;
  buttonGradient?: string;
  buttonHoverGradient?: string;
  checkmarkColor?: string;
  features?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [keywords, setKeywords] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sheetSize: '13' as '13' | '17',
    pricePerInch: 0,
    basePrice: 0,
    isActive: true,
    badge: '',
    badgeColor: 'from-blue-500 to-cyan-500',
    gradient: 'from-blue-400 to-cyan-400',
    buttonGradient: 'from-blue-600 to-cyan-600',
    buttonHoverGradient: 'from-blue-700 to-cyan-700',
    checkmarkColor: 'text-cyan-400',
    features: [] as string[],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      const isAdmin = await checkAdminAccess();
      if (!isAdmin) {
        router.push('/');
        return;
      }

      await loadProducts();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadProducts = async () => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const productsData = productsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Product[];
      
      setProducts(productsData.sort((a, b) => a.sheetSize.localeCompare(b.sheetSize)));
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), {
          ...formData,
          updatedAt: new Date(),
        });
        
        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });
      } else {
        // Create new product
        await addDoc(collection(db, 'products'), {
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        toast({
          title: 'Success',
          description: 'Product created successfully',
        });
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      sheetSize: product.sheetSize,
      pricePerInch: product.pricePerInch,
      basePrice: product.basePrice,
      isActive: product.isActive,
      badge: product.badge || '',
      badgeColor: product.badgeColor || 'from-blue-500 to-cyan-500',
      gradient: product.gradient || 'from-blue-400 to-cyan-400',
      buttonGradient: product.buttonGradient || 'from-blue-600 to-cyan-600',
      buttonHoverGradient: product.buttonHoverGradient || 'from-blue-700 to-cyan-700',
      checkmarkColor: product.checkmarkColor || 'text-cyan-400',
      features: product.features || [],
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      metaKeywords: product.metaKeywords || [],
    });
    setIsAddingNew(true);
  };

  const handleGenerateDescription = async () => {
    if (!keywords.trim()) {
      toast({
        title: 'Keywords Required',
        description: 'Please enter keywords to generate a description',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingDescription(true);
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords: keywords.trim(),
          productName: formData.name,
          sheetSize: formData.sheetSize
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message from server
        throw new Error(data.error || data.details || 'Failed to generate description');
      }

      setFormData({ ...formData, description: data.description });
      
      toast({
        title: 'Success',
        description: 'Description generated successfully',
      });
    } catch (error) {
      console.error('Error generating description:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate description';
      
      toast({
        title: 'AI Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Provide helpful fallback message
      if (errorMessage.includes('AI service not configured')) {
        toast({
          title: 'Setup Required',
          description: 'Please add GEMINI_API_KEY to Vercel environment variables. See AI_SETUP.md for instructions.',
          variant: 'default',
        });
      }
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleGenerateSEO = async () => {
    if (!formData.name || !formData.description) {
      toast({
        title: 'Required Fields Missing',
        description: 'Product name and description are required to generate SEO',
        variant: 'destructive',
      });
      return;
    }

    if (!keywords.trim()) {
      toast({
        title: 'Keywords Required',
        description: 'Please enter keywords to generate SEO metadata',
        variant: 'destructive',
      });
      return;
    }

    setGeneratingSEO(true);
    try {
      const response = await fetch('/api/ai/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.name,
          description: formData.description,
          keywords: keywords.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to generate SEO');
      }

      setFormData({
        ...formData,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: typeof data.keywords === 'string' ? data.keywords.split(',').map((k: string) => k.trim()) : data.keywords,
      });
      
      toast({
        title: 'Success',
        description: 'SEO metadata generated successfully',
      });
    } catch (error) {
      console.error('Error generating SEO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate SEO metadata';
      
      toast({
        title: 'AI Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      if (errorMessage.includes('AI service not configured')) {
        toast({
          title: 'Setup Required',
          description: 'Please add GEMINI_API_KEY to Vercel environment variables. See AI_SETUP.md for instructions.',
          variant: 'default',
        });
      }
    } finally {
      setGeneratingSEO(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      await loadProducts();
      
      toast({
        title: 'Success',
        description: 'Product deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sheetSize: '17',
      pricePerInch: 0,
      basePrice: 0,
      isActive: true,
      badge: '',
      badgeColor: 'from-purple-500 to-pink-500',
      gradient: 'from-purple-400 to-pink-400',
      buttonGradient: 'from-purple-600 to-pink-600',
      buttonHoverGradient: 'from-purple-700 to-pink-700',
      checkmarkColor: 'text-purple-400',
      features: [],
      metaTitle: '',
      metaDescription: '',
      metaKeywords: [],
    });
    setKeywords('');
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Product Management</h1>
            <p className="text-slate-300">Manage DTF transfer pricing and products</p>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        {isAddingNew && (
          <Card className="mb-8 glass-strong border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {editingProduct ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Product Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., 13 inch DTF Transfer"
                      className="glass border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sheetSize" className="text-white">Sheet Size</Label>
                    <select
                      id="sheetSize"
                      value={formData.sheetSize}
                      onChange={(e) => setFormData({ ...formData, sheetSize: e.target.value as '13' | '17' })}
                      className="w-full h-10 px-3 rounded-md glass border border-white/20 text-white"
                    >
                      <option value="13">13 inches</option>
                      <option value="17">17 inches</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="keywords"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Enter keywords (e.g., DTF transfers, custom printing, t-shirts)"
                        className="glass border-white/20 text-white"
                      />
                      <Button
                        type="button"
                        onClick={handleGenerateDescription}
                        disabled={generatingDescription || !keywords.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 whitespace-nowrap"
                      >
                        {generatingDescription ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-1" />
                            AI Write
                          </>
                        )}
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Product description..."
                      className="glass border-white/20 text-white min-h-[100px]"
                    />
                    <p className="text-xs text-slate-400">Enter keywords above and click "AI Write" to generate an SEO-optimized description</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pricePerInch" className="text-white">Price Per Inch ($)</Label>
                    <Input
                      id="pricePerInch"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.pricePerInch}
                      onChange={(e) => setFormData({ ...formData, pricePerInch: parseFloat(e.target.value) })}
                      required
                      placeholder="0.45"
                      className="glass border-white/20 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="basePrice" className="text-white">Base Price ($)</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                      placeholder="0.00"
                      className="glass border-white/20 text-white"
                    />
                    <p className="text-xs text-slate-400 mt-1">Optional flat fee per sheet</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isActive" className="text-white">Active (visible to customers)</Label>
                </div>

                {/* Styling Section */}
                <div className="pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Visual Styling</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="badge" className="text-white">Badge Text (optional)</Label>
                      <Input
                        id="badge"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        placeholder="e.g., Most Popular, Best Value"
                        className="glass border-white/20 text-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">Small badge shown at top of product card</p>
                    </div>

                    <div>
                      <Label htmlFor="badgeColor" className="text-white">Badge Gradient</Label>
                      <select
                        id="badgeColor"
                        value={formData.badgeColor}
                        onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                        className="w-full h-10 px-3 rounded-md glass border border-white/20 text-white"
                      >
                        <option value="from-blue-500 to-cyan-500">Blue to Cyan</option>
                        <option value="from-purple-500 to-pink-500">Purple to Pink</option>
                        <option value="from-green-500 to-emerald-500">Green to Emerald</option>
                        <option value="from-orange-500 to-red-500">Orange to Red</option>
                        <option value="from-yellow-500 to-orange-500">Yellow to Orange</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="gradient" className="text-white">Price Gradient</Label>
                      <select
                        id="gradient"
                        value={formData.gradient}
                        onChange={(e) => setFormData({ ...formData, gradient: e.target.value })}
                        className="w-full h-10 px-3 rounded-md glass border border-white/20 text-white"
                      >
                        <option value="from-blue-400 to-cyan-400">Blue to Cyan</option>
                        <option value="from-purple-400 to-pink-400">Purple to Pink</option>
                        <option value="from-green-400 to-emerald-400">Green to Emerald</option>
                        <option value="from-orange-400 to-red-400">Orange to Red</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="buttonGradient" className="text-white">Button Gradient</Label>
                      <select
                        id="buttonGradient"
                        value={formData.buttonGradient}
                        onChange={(e) => setFormData({ ...formData, buttonGradient: e.target.value })}
                        className="w-full h-10 px-3 rounded-md glass border border-white/20 text-white"
                      >
                        <option value="from-blue-600 to-cyan-600">Blue to Cyan</option>
                        <option value="from-purple-600 to-pink-600">Purple to Pink</option>
                        <option value="from-green-600 to-emerald-600">Green to Emerald</option>
                        <option value="from-orange-600 to-red-600">Orange to Red</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="checkmarkColor" className="text-white">Checkmark Color</Label>
                      <select
                        id="checkmarkColor"
                        value={formData.checkmarkColor}
                        onChange={(e) => setFormData({ ...formData, checkmarkColor: e.target.value })}
                        className="w-full h-10 px-3 rounded-md glass border border-white/20 text-white"
                      >
                        <option value="text-cyan-400">Cyan</option>
                        <option value="text-blue-400">Blue</option>
                        <option value="text-purple-400">Purple</option>
                        <option value="text-pink-400">Pink</option>
                        <option value="text-green-400">Green</option>
                        <option value="text-emerald-400">Emerald</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="features" className="text-white">Features (one per line)</Label>
                      <Textarea
                        id="features"
                        value={formData.features.join('\n')}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value.split('\n').filter(f => f.trim()) })}
                        placeholder="Perfect for small orders&#10;Great for testing designs&#10;Fast turnaround"
                        className="glass border-white/20 text-white min-h-[100px]"
                      />
                      <p className="text-xs text-slate-400 mt-1">Each line becomes a bullet point with checkmark</p>
                    </div>
                  </div>
                </div>

                {/* SEO Section */}
                <div className="pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">SEO Metadata</h3>
                    <Button
                      type="button"
                      onClick={handleGenerateSEO}
                      disabled={generatingSEO || !formData.name || !formData.description || !keywords.trim()}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600"
                    >
                      {generatingSEO ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Wand2 className="h-4 w-4 mr-2" />
                      )}
                      Generate SEO
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="metaTitle" className="text-white">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="SEO-optimized title (50-60 chars)"
                        className="glass border-white/20 text-white"
                        maxLength={60}
                      />
                      <p className="text-xs text-slate-400 mt-1">{formData.metaTitle.length}/60 characters</p>
                    </div>

                    <div>
                      <Label htmlFor="metaDescription" className="text-white">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="SEO-optimized description (150-160 chars)"
                        className="glass border-white/20 text-white min-h-[80px]"
                        maxLength={160}
                      />
                      <p className="text-xs text-slate-400 mt-1">{formData.metaDescription.length}/160 characters</p>
                    </div>

                    <div>
                      <Label htmlFor="metaKeywords" className="text-white">Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        value={formData.metaKeywords.join(', ')}
                        onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                        placeholder="keyword1, keyword2, keyword3"
                        className="glass border-white/20 text-white"
                      />
                      <p className="text-xs text-slate-400 mt-1">Comma-separated list of keywords</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={saving} className="bg-gradient-to-r from-green-600 to-emerald-600">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </Button>
                  <Button type="button" onClick={resetForm} variant="outline" className="border-white/20 text-white">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add New Button */}
        {!isAddingNew && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Product
          </Button>
        )}

        {/* Products List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="glass-strong border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                    <p className="text-sm text-slate-400 mt-1">
                      {product.sheetSize}" sheet
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-sm">{product.description}</p>
                
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Price Per Inch:</span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {product.pricePerInch.toFixed(2)}
                    </span>
                  </div>
                  {product.basePrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Base Price:</span>
                      <span className="text-white font-bold flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {product.basePrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleEdit(product)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-white/20 text-white"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>

                <p className="text-xs text-slate-500">
                  Updated: {product.updatedAt.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <Card className="glass-strong border-white/10">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Products Yet</h3>
              <p className="text-slate-400 mb-4">Get started by adding your first product</p>
              <Button
                onClick={() => setIsAddingNew(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
