import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
// Note: This might duplicate logic from src/lib/firebase-admin.ts if it exists.
// Let's check if we can reuse src/lib/firebase-admin.ts first.
import { getAuth as getAdminAuth } from '@/lib/firebase-admin';

const DEFAULT_ADMINS = ['admin@dtfwholesale.ca', 'trent@3thirty3.ca'];

export async function verifyAdminRequest(request: Request): Promise<{ authorized: boolean; user?: any; message?: string }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, message: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    
    const decodedToken = await auth.verifyIdToken(token);
    const email = decodedToken.email?.toLowerCase();

    // Get allowed admins from environment or defaults
    const envAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS
      ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',')
      : [];
    
    const allowedAdmins = [...new Set([...DEFAULT_ADMINS, ...envAdmins])]
      .map(e => e.trim().toLowerCase());

    if (!email || !allowedAdmins.includes(email)) {
      return { authorized: false, message: 'User is not an authorized admin' };
    }

    return { authorized: true, user: decodedToken };
  } catch (error) {
    console.error('Admin verification error:', error);
    return { authorized: false, message: 'Invalid token' };
  }
}

export async function verifyUserRequest(request: Request): Promise<{ authorized: boolean; user?: any; message?: string }> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, message: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    
    const decodedToken = await auth.verifyIdToken(token);
    return { authorized: true, user: decodedToken };
  } catch (error) {
    console.error('User verification error:', error);
    return { authorized: false, message: 'Invalid token' };
  }
}
