import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Get admin emails from environment variable or use defaults
// Normalize to lowercase for case-insensitive comparison
const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS
  ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',')
  : ['admin@dtfwholesale.ca', 'trent@3thirty3.ca'])
  .map(email => email.trim().toLowerCase());

export async function checkAdminAccess(): Promise<boolean> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!user) {
        resolve(false);
        return;
      }
      const userEmail = user.email ? user.email.toLowerCase() : '';
      resolve(ADMIN_EMAILS.includes(userEmail));
    });
  });
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
