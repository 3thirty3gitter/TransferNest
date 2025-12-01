'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/layout/header';

export default function TestEmailPage() {
  const [orderId, setOrderId] = useState('');
  const [emailOverride, setEmailOverride] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendTestEmail = async (type: string) => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Please enter an Order ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, type, emailOverride }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-2xl">
        <Card className="glass-strong border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl">Test Email System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Order ID (Required)</Label>
              <Input 
                value={orderId} 
                onChange={(e) => setOrderId(e.target.value)} 
                placeholder="Enter an existing Order ID from Firestore"
                className="bg-slate-900/50 border-slate-700"
              />
              <p className="text-xs text-slate-400">
                The system needs a real order ID to fetch items and totals.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Override Recipient Email (Optional)</Label>
              <Input 
                value={emailOverride} 
                onChange={(e) => setEmailOverride(e.target.value)} 
                placeholder="your.email@example.com"
                className="bg-slate-900/50 border-slate-700"
              />
              <p className="text-xs text-slate-400">
                If left blank, email will go to the customer on the order.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Button 
                onClick={() => sendTestEmail('confirmation')} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Send Order Confirmation
              </Button>
              
              <Button 
                onClick={() => sendTestEmail('update')} 
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Send "Printing" Update
              </Button>

              <Button 
                onClick={() => sendTestEmail('shipped')} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Send "Shipped" Update
              </Button>

              <Button 
                onClick={() => sendTestEmail('pickup')} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                Send "Ready for Pickup"
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
