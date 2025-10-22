import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Get admin emails from environment variable or use defaults
const ADMIN_EMAILS = process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(email => email.trim())
  : ['admin@transfernest.com'];

export async function checkAdminAccess(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        resolve(false);
        return;
      }
      resolve(ADMIN_EMAILS.includes(user.email || ''));
    });
  });
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return email ? ADMIN_EMAILS.includes(email) : false;
}
