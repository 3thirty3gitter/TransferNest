'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { checkAdminAccess } from '@/middleware/adminAuth';
import { 
  getCompanySettings, 
  updateCompanySettings, 
  testShippingIntegration,
  type CompanySettings 
} from '@/lib/company-settings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Save, 
  Building2, 
  CreditCard, 
  Package, 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin,
  MapPin,
  Clock,
  Mail,
  Phone,
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'company' | 'integrations' | 'social';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('company');
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [testingShipping, setTestingShipping] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      const hasAccess = await checkAdminAccess();
      if (!hasAccess) {
        router.push('/admin/login');
        return;
      }
      
      setIsAdmin(true);
      await loadSettings();
    });

    return () => unsubscribe();
  }, [router]);

  async function loadSettings() {
    try {
      const data = await getCompanySettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings || !auth.currentUser) return;
    
    setSaving(true);
    try {
      const success = await updateCompanySettings(settings, auth.currentUser.uid);
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Your settings have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleTestShipping() {
    if (!settings?.shipping) return;
    
    setTestingShipping(true);
    try {
      const result = await testShippingIntegration(settings.shipping);
      
      toast({
        title: result.success ? "Connection Successful" : "Connection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Unable to test shipping connection",
        variant: "destructive",
      });
    } finally {
      setTestingShipping(false);
    }
  }

  const updateCompanyInfo = (field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      companyInfo: {
        ...settings.companyInfo,
        [field]: value,
      },
    });
  };

  const updateAddress = (field: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      companyInfo: {
        ...settings.companyInfo,
        address: {
          ...settings.companyInfo.address,
          [field]: value,
        },
      },
    });
  };

  const updatePickupHours = (day: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      companyInfo: {
        ...settings.companyInfo,
        pickupInfo: {
          ...settings.companyInfo.pickupInfo,
          hours: {
            ...settings.companyInfo.pickupInfo.hours,
            [day]: value,
          },
        },
      },
    });
  };

  const updateSocialMedia = (platform: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialMedia: {
        ...settings.socialMedia,
        [platform]: value,
      },
    });
  };

  const updateShipping = (field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      shipping: {
        ...settings.shipping,
        [field]: value,
      },
    });
  };

  const updateEmail = (field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        [field]: value,
      },
    });
  };

  const updateMicrosoft365 = (field: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      email: {
        ...settings.email,
        microsoft365: {
          tenantId: settings.email.microsoft365?.tenantId || '',
          clientId: settings.email.microsoft365?.clientId || '',
          clientSecret: settings.email.microsoft365?.clientSecret || '',
          userEmail: settings.email.microsoft365?.userEmail || '',
          ...settings.email.microsoft365,
          [field]: value,
        },
      },
    });
  };

  if (loading || !isAdmin || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-white">Settings</h1>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'company'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Building2 className="inline h-5 w-5 mr-2" />
            Company Info
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Package className="inline h-5 w-5 mr-2" />
            Integrations
          </button>
          <button
            onClick={() => setActiveTab('social')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              activeTab === 'social'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            <Facebook className="inline h-5 w-5 mr-2" />
            Social Media
          </button>
        </div>

        {/* Company Info Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Company Details
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Company Name</Label>
                  <Input
                    value={settings.companyInfo.name}
                    onChange={(e) => updateCompanyInfo('name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Tagline</Label>
                  <Input
                    value={settings.companyInfo.tagline}
                    onChange={(e) => updateCompanyInfo('tagline', e.target.value)}
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Description</Label>
                  <textarea
                    value={settings.companyInfo.description}
                    onChange={(e) => updateCompanyInfo('description', e.target.value)}
                    rows={3}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-200">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={settings.companyInfo.email}
                      onChange={(e) => updateCompanyInfo('email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">
                      <Phone className="inline h-4 w-4 mr-1" />
                      Phone
                    </Label>
                    <Input
                      type="tel"
                      value={settings.companyInfo.phone}
                      onChange={(e) => updateCompanyInfo('phone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Business Address
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Street Address</Label>
                  <Input
                    value={settings.companyInfo.address.street}
                    onChange={(e) => updateAddress('street', e.target.value)}
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-slate-200">City</Label>
                    <Input
                      value={settings.companyInfo.address.city}
                      onChange={(e) => updateAddress('city', e.target.value)}
                      className="bg-white/10 border-white/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Province/State</Label>
                    <Input
                      value={settings.companyInfo.address.state}
                      onChange={(e) => updateAddress('state', e.target.value)}
                      className="bg-white/10 border-white/20 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-200">Postal Code</Label>
                    <Input
                      value={settings.companyInfo.address.zipCode}
                      onChange={(e) => updateAddress('zipCode', e.target.value)}
                      className="bg-white/10 border-white/20 text-white mt-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Information */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Clock className="h-6 w-6" />
                Pickup Information
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Pickup Address</Label>
                  <Input
                    value={settings.companyInfo.pickupInfo.address}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo,
                        pickupInfo: {
                          ...settings.companyInfo.pickupInfo,
                          address: e.target.value,
                        },
                      },
                    })}
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 mb-3 block">Pickup Hours</Label>
                  <div className="space-y-3">
                    {Object.entries(settings.companyInfo.pickupInfo.hours).map(([day, hours]) => (
                      <div key={day} className="grid grid-cols-4 gap-4 items-center">
                        <Label className="text-slate-300 capitalize">{day}</Label>
                        <Input
                          value={hours}
                          onChange={(e) => updatePickupHours(day, e.target.value)}
                          placeholder="9:00 AM - 5:00 PM"
                          className="col-span-3 bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-slate-200">Pickup Instructions</Label>
                  <textarea
                    value={settings.companyInfo.pickupInfo.instructions}
                    onChange={(e) => setSettings({
                      ...settings,
                      companyInfo: {
                        ...settings.companyInfo,
                        pickupInfo: {
                          ...settings.companyInfo.pickupInfo,
                          instructions: e.target.value,
                        },
                      },
                    })}
                    rows={2}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            {/* Payment Integration */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <CreditCard className="h-6 w-6" />
                Payment Integration (Square)
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Square Payment Enabled</p>
                    <p className="text-slate-400 text-sm">Environment: {settings.payment.environment}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-200">Application ID</Label>
                  <Input
                    value={settings.payment.applicationId}
                    readOnly
                    className="bg-white/5 border-white/20 text-slate-400 mt-2"
                  />
                  <p className="text-xs text-slate-400 mt-1">Configured via environment variables</p>
                </div>
                <div>
                  <Label className="text-slate-200">Location ID</Label>
                  <Input
                    value={settings.payment.locationId}
                    readOnly
                    className="bg-white/5 border-white/20 text-slate-400 mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Integration */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="h-6 w-6" />
                Shipping Integration
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Shipping Provider</Label>
                  <select
                    value={settings.shipping.provider}
                    onChange={(e) => updateShipping('provider', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none" className="bg-slate-800">None</option>
                    <option value="shipstation" className="bg-slate-800">ShipStation</option>
                    <option value="easypost" className="bg-slate-800">EasyPost</option>
                    <option value="canada-post" className="bg-slate-800">Canada Post</option>
                  </select>
                </div>

                {settings.shipping.provider !== 'none' && (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="shippingEnabled"
                        checked={settings.shipping.enabled}
                        onChange={(e) => updateShipping('enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-blue-500 bg-white/10 checked:bg-blue-500 cursor-pointer"
                      />
                      <Label htmlFor="shippingEnabled" className="text-white cursor-pointer">
                        Enable Shipping Integration
                      </Label>
                    </div>

                    <div>
                      <Label className="text-slate-200">API Key</Label>
                      <Input
                        type="password"
                        value={settings.shipping.apiKey || ''}
                        onChange={(e) => updateShipping('apiKey', e.target.value)}
                        placeholder="Enter API key"
                        className="bg-white/10 border-white/20 text-white mt-2"
                      />
                    </div>

                    {(settings.shipping.provider === 'shipstation' || settings.shipping.provider === 'easypost') && (
                      <div>
                        <Label className="text-slate-200">API Secret</Label>
                        <Input
                          type="password"
                          value={settings.shipping.apiSecret || ''}
                          onChange={(e) => updateShipping('apiSecret', e.target.value)}
                          placeholder="Enter API secret"
                          className="bg-white/10 border-white/20 text-white mt-2"
                        />
                      </div>
                    )}

                    {settings.shipping.provider === 'shipstation' && (
                      <div>
                        <Label className="text-slate-200">Store ID</Label>
                        <Input
                          value={settings.shipping.storeId || ''}
                          onChange={(e) => updateShipping('storeId', e.target.value)}
                          placeholder="Enter store ID"
                          className="bg-white/10 border-white/20 text-white mt-2"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleTestShipping}
                      disabled={testingShipping}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2"
                    >
                      {testingShipping ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Email Integration */}
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Mail className="h-6 w-6" />
                Email Integration
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200">Email Provider</Label>
                  <select
                    value={settings.email?.provider || 'none'}
                    onChange={(e) => updateEmail('provider', e.target.value)}
                    className="w-full bg-white/10 border border-white/20 text-white rounded-md px-3 py-2 mt-2 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none" className="bg-slate-800">None</option>
                    <option value="microsoft365" className="bg-slate-800">Microsoft 365 (Graph API)</option>
                    <option value="resend" className="bg-slate-800">Resend (Default)</option>
                  </select>
                </div>

                {settings.email?.provider === 'microsoft365' && (
                  <>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="emailEnabled"
                        checked={settings.email.enabled}
                        onChange={(e) => updateEmail('enabled', e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-blue-500 bg-white/10 checked:bg-blue-500 cursor-pointer"
                      />
                      <Label htmlFor="emailEnabled" className="text-white cursor-pointer">
                        Enable Microsoft 365 Integration
                      </Label>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
                      <p className="text-sm text-blue-200">
                        To connect Microsoft 365, you need to register an application in Azure Active Directory.
                        Grant the application <strong>Mail.Send</strong> permissions.
                      </p>
                    </div>

                    <div>
                      <Label className="text-slate-200">Tenant ID</Label>
                      <Input
                        value={settings.email.microsoft365?.tenantId || ''}
                        onChange={(e) => updateMicrosoft365('tenantId', e.target.value)}
                        placeholder="Enter Azure Tenant ID"
                        className="bg-white/10 border-white/20 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-200">Client ID (App ID)</Label>
                      <Input
                        value={settings.email.microsoft365?.clientId || ''}
                        onChange={(e) => updateMicrosoft365('clientId', e.target.value)}
                        placeholder="Enter Azure Client ID"
                        className="bg-white/10 border-white/20 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-200">Client Secret</Label>
                      <Input
                        type="password"
                        value={settings.email.microsoft365?.clientSecret || ''}
                        onChange={(e) => updateMicrosoft365('clientSecret', e.target.value)}
                        placeholder="Enter Azure Client Secret"
                        className="bg-white/10 border-white/20 text-white mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-200">Sender Email Address</Label>
                      <Input
                        value={settings.email.microsoft365?.userEmail || ''}
                        onChange={(e) => updateMicrosoft365('userEmail', e.target.value)}
                        placeholder="orders@yourdomain.com"
                        className="bg-white/10 border-white/20 text-white mt-2"
                      />
                      <p className="text-xs text-slate-400 mt-1">Must match the user account associated with the app registration or have "Send As" permissions.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <div className="glass-strong rounded-2xl p-6 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Social Media Links</h2>
              <p className="text-slate-400 mb-6">Add your social media profile URLs. Leave blank to hide from website.</p>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Facebook className="h-5 w-5 text-blue-500" />
                    Facebook
                  </Label>
                  <Input
                    value={settings.socialMedia.facebook || ''}
                    onChange={(e) => updateSocialMedia('facebook', e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    Instagram
                  </Label>
                  <Input
                    value={settings.socialMedia.instagram || ''}
                    onChange={(e) => updateSocialMedia('instagram', e.target.value)}
                    placeholder="https://instagram.com/yourprofile"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    Twitter / X
                  </Label>
                  <Input
                    value={settings.socialMedia.twitter || ''}
                    onChange={(e) => updateSocialMedia('twitter', e.target.value)}
                    placeholder="https://twitter.com/yourhandle"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Linkedin className="h-5 w-5 text-blue-600" />
                    LinkedIn
                  </Label>
                  <Input
                    value={settings.socialMedia.linkedin || ''}
                    onChange={(e) => updateSocialMedia('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">TikTok</Label>
                  <Input
                    value={settings.socialMedia.tiktok || ''}
                    onChange={(e) => updateSocialMedia('tiktok', e.target.value)}
                    placeholder="https://tiktok.com/@yourhandle"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">YouTube</Label>
                  <Input
                    value={settings.socialMedia.youtube || ''}
                    onChange={(e) => updateSocialMedia('youtube', e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-slate-200">Pinterest</Label>
                  <Input
                    value={settings.socialMedia.pinterest || ''}
                    onChange={(e) => updateSocialMedia('pinterest', e.target.value)}
                    placeholder="https://pinterest.com/yourprofile"
                    className="bg-white/10 border-white/20 text-white mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
