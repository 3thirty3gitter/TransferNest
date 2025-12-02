'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { Mail, RefreshCw, Search, Star, Trash2, Archive, MoreVertical, Reply, Forward } from 'lucide-react';

interface Email {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  body: {
    contentType: string;
    content: string;
  };
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  async function fetchEmails() {
    try {
      setRefreshing(true);
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const response = await fetch('/api/admin/email', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch emails');
      }

      const data = await response.json();
      setEmails(data.emails);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching emails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleSelectEmail(email: Email) {
    setSelectedEmail(email);
    if (!email.isRead) {
      // Optimistically update UI
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
      
      // Call API to mark as read
      try {
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();
        
        await fetch('/api/admin/email', {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageId: email.id,
            action: 'markRead',
          }),
        });
      } catch (err) {
        console.error('Error marking email as read:', err);
      }
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function formatFullDate(dateString: string) {
    return new Date(dateString).toLocaleString([], { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function processEmailBody(content: string) {
    if (!content) return '';
    // Replace cid: images with a transparent pixel to prevent console errors
    // This handles the "net::ERR_UNKNOWN_URL_SCHEME" error for inline images
    return content.replace(/src="cid:[^"]*"/g, 'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:none"');
  }

  if (loading && !refreshing && emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen bg-slate-950">
      {/* Email List */}
      <div className={`
        w-full md:w-96 border-r border-white/10 flex flex-col bg-slate-900
        ${selectedEmail ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Inbox</h2>
          <button 
            onClick={fetchEmails}
            disabled={refreshing}
            className={`p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search mail" 
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
            {error}
            {error.includes('not enabled') && (
              <div className="mt-2">
                <a href="/admin/settings" className="underline hover:text-red-300">Go to Settings</a> to configure Microsoft 365.
              </div>
            )}
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {emails.length === 0 && !loading && !error ? (
            <div className="p-8 text-center text-slate-500">
              <Mail className="mx-auto mb-3 opacity-50" size={48} />
              <p>No emails found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {emails.map((email) => (
                <div 
                  key={email.id}
                  onClick={() => handleSelectEmail(email)}
                  className={`
                    p-4 cursor-pointer hover:bg-white/5 transition-colors
                    ${selectedEmail?.id === email.id ? 'bg-blue-900/20 border-l-2 border-blue-500' : 'border-l-2 border-transparent'}
                    ${!email.isRead ? 'bg-slate-800/30' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm truncate pr-2 ${!email.isRead ? 'font-bold text-white' : 'font-medium text-slate-300'}`}>
                      {email.from.emailAddress.name || email.from.emailAddress.address}
                    </h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(email.receivedDateTime)}
                    </span>
                  </div>
                  <div className={`text-sm mb-1 truncate ${!email.isRead ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>
                    {email.subject || '(No Subject)'}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {email.bodyPreview}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Email Content */}
      <div className={`
        flex-1 flex flex-col bg-slate-950
        ${!selectedEmail ? 'hidden md:flex' : 'flex'}
      `}>
        {selectedEmail ? (
          <>
            {/* Toolbar */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full mr-2"
                >
                  <ArrowLeft size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full" title="Archive">
                  <Archive size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full" title="Delete">
                  <Trash2 size={18} />
                </button>
                <div className="h-6 w-px bg-white/10 mx-2"></div>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full" title="Mark as unread">
                  <Mail size={18} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-white mb-6">{selectedEmail.subject}</h1>
                
                <div className="flex items-start justify-between mb-8 pb-8 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {selectedEmail.from.emailAddress.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">
                        {selectedEmail.from.emailAddress.name}
                        <span className="text-slate-500 font-normal text-sm ml-2">
                          &lt;{selectedEmail.from.emailAddress.address}&gt;
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatFullDate(selectedEmail.receivedDateTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                      <Reply size={16} /> Reply
                    </button>
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                      <Forward size={16} /> Forward
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden min-h-[600px]">
                  <iframe 
                    srcDoc={processEmailBody(selectedEmail.body.content)}
                    className="w-full h-full min-h-[600px] border-0"
                    title="Email content"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Mail size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowLeft({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  );
}
