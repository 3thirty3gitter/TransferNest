
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  AuthErrorCodes,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react'; // Using Chrome as a stand-in for Google icon

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupState, setSignupState] = useState('');
  const [signupZipCode, setSignupZipCode] = useState('');
  const [signupCountry, setSignupCountry] = useState('Canada');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user document in Firestore
      const { doc, setDoc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      const userDocRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        const nameParts = result.user.displayName?.split(' ') || ['', ''];
        await setDoc(userDocRef, {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: result.user.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Canada',
          createdAt: new Date().toISOString(),
        });
      }
      
      toast({ title: 'Successfully signed in with Google!' });
      router.push('/');
    } catch (error: any) {
      console.error('Error signing in with Google', error);
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      toast({ title: 'Successfully signed in!' });
      router.push('/');
    } catch (error: any) {
      console.error('Error signing in with email', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign-In Failed',
        description,
      });
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupEmail,
        signupPassword
      );
      const displayName = `${signupFirstName} ${signupLastName}`.trim();
      await updateProfile(userCredential.user, { displayName });
      
      // Save additional profile data to Firestore
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      try {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          firstName: signupFirstName,
          lastName: signupLastName,
          email: signupEmail,
          phone: signupPhone,
          address: signupAddress,
          city: signupCity,
          state: signupState,
          zipCode: signupZipCode,
          country: signupCountry,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        // Continue anyway - user is created in Auth
      }
      
      toast({ title: 'Account created successfully!' });
      router.push('/');
    } catch (error: any) {
      console.error('Error signing up with email', error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code === AuthErrorCodes.EMAIL_EXISTS || error.code === 'auth/email-already-in-use') {
        description = 'An account with this email address already exists. Please sign in instead or use a different email.';
      } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
        description = 'The password is too weak. Please choose a stronger password.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign-Up Failed',
        description,
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Tabs Toggle */}
        <Tabs defaultValue="sign-in" className="w-full">
          <div className="glass-strong rounded-2xl p-2 mb-4 border border-white/20">
            <TabsList className="grid grid-cols-2 gap-2 bg-transparent">
              <TabsTrigger
                value="sign-in"
                className="py-3 px-4 rounded-xl font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:bg-white/10"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="sign-up"
                className="py-3 px-4 rounded-xl font-semibold transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:bg-white/10"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="sign-in">
            <div className="glass-strong rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-300">
                  Access your account to manage your designs.
                </p>
              </div>
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-slate-200 font-semibold">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-slate-200 font-semibold">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 text-slate-400 bg-slate-900/50">Or continue with</span>
                </div>
              </div>
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold rounded-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
              >
                <Chrome className="h-5 w-5" />
                Sign in with Google
              </button>
            </div>
          </TabsContent>
          <TabsContent value="sign-up">
            <div className="glass-strong rounded-2xl p-8 border border-white/20 shadow-xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                <p className="text-slate-300">
                  Get started with your DTF printing journey.
                </p>
              </div>
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname" className="text-slate-200 font-semibold">First Name *</Label>
                    <Input
                      id="signup-firstname"
                      type="text"
                      placeholder="John"
                      required
                      value={signupFirstName}
                      onChange={(e) => setSignupFirstName(e.target.value)}
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-lastname" className="text-slate-200 font-semibold">Last Name *</Label>
                    <Input
                      id="signup-lastname"
                      type="text"
                      placeholder="Smith"
                      required
                      value={signupLastName}
                      onChange={(e) => setSignupLastName(e.target.value)}
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-200 font-semibold">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your.email@example.com"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-200 font-semibold">Password *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-slate-200 font-semibold">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="(416) 555-1234"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-address" className="text-slate-200 font-semibold">Street Address</Label>
                  <Input
                    id="signup-address"
                    type="text"
                    placeholder="123 Main Street"
                    value={signupAddress}
                    onChange={(e) => setSignupAddress(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-city" className="text-slate-200 font-semibold">City</Label>
                    <Input
                      id="signup-city"
                      type="text"
                      placeholder="Toronto"
                      value={signupCity}
                      onChange={(e) => setSignupCity(e.target.value)}
                      disabled={isLoading}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-state" className="text-slate-200 font-semibold">Province</Label>
                    <select
                      id="signup-state"
                      value={signupState}
                      onChange={(e) => setSignupState(e.target.value)}
                      disabled={isLoading}
                      className="w-full h-10 px-3 bg-white/10 border border-white/20 rounded-md text-white focus:bg-white/20"
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
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-zipcode" className="text-slate-200 font-semibold">Postal Code</Label>
                  <Input
                    id="signup-zipcode"
                    type="text"
                    placeholder="M5V 3A8"
                    value={signupZipCode}
                    onChange={(e) => setSignupZipCode(e.target.value)}
                    disabled={isLoading}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-xl transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
