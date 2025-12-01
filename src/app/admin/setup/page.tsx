'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { isAdminEmail } from '@/middleware/adminAuth';

export default function AdminSetupPage() {
  const [email, setEmail] = useState('trent@3thirty3.ca');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!isAdminEmail(email)) {
        setMessage({ type: 'error', text: 'This email is not in the admin allowlist.' });
        setLoading(false);
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
      setMessage({ type: 'success', text: 'Account created successfully! You can now log in.' });
      setTimeout(() => router.push('/admin/login'), 2000);
    } catch (err: any) {
      console.error('Creation error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setMessage({ type: 'error', text: 'Account already exists. Try resetting your password.' });
      } else if (err.code === 'auth/weak-password') {
        setMessage({ type: 'error', text: 'Password should be at least 6 characters.' });
      } else {
        setMessage({ type: 'error', text: err.message });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter an email address.' });
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
    } catch (err: any) {
      console.error('Reset error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Account Setup</h1>
          <p className="text-gray-500">Create account or reset password</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="New password"
            />
            <p className="text-xs text-gray-500 mt-1">Only required for creating a new account</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full py-2 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Reset Password
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <a href="/admin/login" className="text-blue-600 hover:underline">Back to Login</a>
        </div>
      </div>
    </div>
  );
}
