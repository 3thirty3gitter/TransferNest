'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { isAdminEmail } from '@/middleware/adminAuth';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Settings, 
  Mail, 
  LogOut,
  Menu,
  X,
  BarChart3,
  Search,
  Plus
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    let mounted = true;
    let resolved = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;
      resolved = true;

      if (!user) {
        router.push('/admin/login');
        return;
      }
      
      const hasAccess = isAdminEmail(user.email);
      if (!mounted) return;

      if (!hasAccess) {
        router.push('/admin/login');
        return;
      }
      
      setIsAdmin(true);
      setLoading(false);
    });

    // Timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted && !resolved) {
        console.warn('Admin auth check timed out');
        router.push('/admin/login');
      }
    }, 5000);

    return () => {
      mounted = false;
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Customers', href: '/admin/customers', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Email', href: '/admin/email', icon: Mail },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors";
    const isActive = pathname === path || (path !== '/admin' && pathname?.startsWith(path));

    if (isActive) {
        return `${baseClass} bg-gray-800 text-white font-semibold`;
    }

    return `${baseClass} text-gray-400 hover:bg-gray-800 hover:text-white`;
  };

  return (
    <div className="bg-gray-950 text-gray-200 antialiased min-h-screen flex">
        <div className="absolute inset-0 -z-10 overflow-hidden fixed">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-900 rounded-full filter blur-[150px] opacity-30 animate-breathe"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-900 rounded-full filter blur-[150px] opacity-30 animate-breathe animation-delay-[-4s]"></div>
        </div>

        {/* Mobile Sidebar Toggle */}
        <button 
            className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-md text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
        >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <aside className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 dash-glass-card p-6 flex-col flex transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
            <Link href="/admin" className="text-3xl font-bold text-white mb-10">
                TransferNest<span className="text-cyan-400">.</span>
            </Link>
            <nav className="flex-grow flex flex-col space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <Link key={item.name} href={item.href} className={getLinkClass(item.href)} onClick={() => setSidebarOpen(false)}>
                        <item.icon size={24} strokeWidth={1.5} />
                        <span>{item.name}</span>
                    </Link>
                ))}
            </nav>

            <div className="mt-auto">
                <div className="border-t border-gray-800 pt-4">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-400 hover:bg-red-900/20 hover:text-red-400 w-full"
                    >
                        <LogOut size={24} strokeWidth={1.5} />
                        <span>Sign Out</span>
                    </button>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mt-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold border-2 border-gray-700">
                            A
                        </div>
                        <div>
                            <span className="font-semibold text-white block">Admin</span>
                            <span className="block text-sm text-gray-400">admin@transfernest.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
            <header className="sticky top-0 z-30 dash-glass-card">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="relative w-full max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <Search size={20} strokeWidth={1.5} />
                        </span>
                        <input type="text" placeholder="Search (Cmd+K)" className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" />
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <Link href="/admin/products" className="hidden sm:inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold px-4 py-2 rounded-lg hover:from-purple-700 hover:to-cyan-600 transition-all shadow-lg text-sm">
                            <Plus size={18} />
                            Add Product
                        </Link>
                        <button className="text-gray-400 hover:text-white relative">
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
                            <Mail size={24} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            </header>
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}
    </div>
  );
}
