'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { User, Mail, Calendar, Package, LogOut, Edit2, Save, X, MapPin, Phone } from 'lucide-react';
import { signOut, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CustomerProfile {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [profile, setProfile] = useState<CustomerProfile>({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'CA',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load customer profile from Firestore
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const profileRef = doc(db, 'customers', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const data = profileSnap.data() as CustomerProfile;
          setProfile(data);
        } else {
          // Initialize from displayName if available
          if (user.displayName) {
            const nameParts = user.displayName.trim().split(' ');
            setProfile(prev => ({
              ...prev,
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error Loading Profile',
          description: 'Could not load your profile information.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user, toast]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    // Validate required fields
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'First name and last name are required.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      // Update displayName in Firebase Auth
      const fullName = `${profile.firstName.trim()} ${profile.lastName.trim()}`;
      await updateProfile(user, { displayName: fullName });
      
      // Save full profile to Firestore
      const profileRef = doc(db, 'customers', user.uid);
      await setDoc(profileRef, {
        ...profile,
        email: user.email,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = async () => {
    // Reload profile from Firestore
    if (!user) return;
    
    try {
      const profileRef = doc(db, 'customers', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as CustomerProfile);
      }
    } catch (error) {
      console.error('Error reloading profile:', error);
    }
    
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof CustomerProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading || isLoading) {
    return (
      <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <Header />
        <div className="h-16"></div>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading account...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const memberSince = user.metadata.creationTime 
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : 'Recently';

  return (
    <div className="flex flex-col min-h-dvh bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <Header />
      <div className="h-16"></div>
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            My Account
          </h1>
          <p className="text-slate-400">Manage your profile and view your activity</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Card */}
          <div className="glass-strong rounded-3xl p-8">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <User className="h-6 w-6 text-blue-400" />
                Profile Information
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">First Name *</Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="First name"
                    />
                  ) : (
                    <p className="text-white text-lg">{profile.firstName || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Last Name *</Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Last name"
                    />
                  ) : (
                    <p className="text-white text-lg">{profile.lastName || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <p className="text-white text-lg">{user.email}</p>
                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 555-5555"
                  />
                ) : (
                  <p className="text-white text-lg">{profile.phone || 'Not set'}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Street Address
                </Label>
                {isEditing ? (
                  <Input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main Street"
                  />
                ) : (
                  <p className="text-white text-lg">{profile.address || 'Not set'}</p>
                )}
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">City</Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={profile.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="City"
                    />
                  ) : (
                    <p className="text-white text-lg">{profile.city || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Province/State</Label>
                  {isEditing ? (
                    <select
                      value={profile.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="AB">Alberta</option>
                      <option value="BC">British Columbia</option>
                      <option value="MB">Manitoba</option>
                      <option value="NB">New Brunswick</option>
                      <option value="NL">Newfoundland and Labrador</option>
                      <option value="NS">Nova Scotia</option>
                      <option value="ON">Ontario</option>
                      <option value="PE">Prince Edward Island</option>
                      <option value="QC">Quebec</option>
                      <option value="SK">Saskatchewan</option>
                      <option value="NT">Northwest Territories</option>
                      <option value="NU">Nunavut</option>
                      <option value="YT">Yukon</option>
                    </select>
                  ) : (
                    <p className="text-white text-lg">{profile.state || 'Not set'}</p>
                  )}
                </div>
                
                <div>
                  <Label className="text-sm text-slate-400 mb-2 block">Postal Code</Label>
                  {isEditing ? (
                    <Input
                      type="text"
                      value={profile.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="A1A 1A1"
                    />
                  ) : (
                    <p className="text-white text-lg">{profile.zipCode || 'Not set'}</p>
                  )}
                </div>
              </div>

              {/* Country */}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block">Country</Label>
                {isEditing ? (
                  <select
                    value={profile.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                ) : (
                  <p className="text-white text-lg">{profile.country === 'CA' ? 'Canada' : 'United States'}</p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <Label className="text-sm text-slate-400 mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Member Since
                </Label>
                <p className="text-white text-lg">{memberSince}</p>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-colors flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="glass-strong rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-400" />
              Quick Actions
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/orders"
                className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-white/10 rounded-2xl transition-all hover:scale-105 group"
              >
                <Package className="h-8 w-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-1">Order History</h3>
                <p className="text-sm text-slate-400">View all your past orders</p>
              </Link>

              <Link
                href="/nesting-tool"
                className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-white/10 rounded-2xl transition-all hover:scale-105 group"
              >
                <Edit2 className="h-8 w-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-1">Create Design</h3>
                <p className="text-sm text-slate-400">Build a new gang sheet</p>
              </Link>
            </div>
          </div>

          {/* Account Actions Card */}
          <div className="glass-strong rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Account Actions</h2>
            
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
