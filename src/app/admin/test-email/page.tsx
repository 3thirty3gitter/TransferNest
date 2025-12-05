'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, User, Package, Truck, CheckCircle, Bell, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function TestEmailPage() {
  const [orderId, setOrderId] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Send test email with real order data
  const sendTestWithOrder = async (type: string) => {
    if (!orderId) {
      toast({
        title: "Error",
        description: "Please enter an Order ID",
        variant: "destructive",
      });
      return;
    }

    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(type);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, type, emailOverride: testEmail }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Email Sent",
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
      setLoading(null);
    }
  };

  // Send pure test email with mock data (no order required)
  const sendPureTest = async (type: string) => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(type);
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          emailOverride: testEmail,
          useMockData: true 
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "✅ Test Email Sent",
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
      setLoading(null);
    }
  };

  const emailTypes = [
    {
      id: 'confirmation',
      name: 'Order Confirmation',
      description: 'Sent to customer after successful payment',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      category: 'customer'
    },
    {
      id: 'update',
      name: 'Status Update (Printing)',
      description: 'Sent when order moves to "Printing" status',
      icon: Package,
      color: 'bg-purple-600 hover:bg-purple-700',
      category: 'customer'
    },
    {
      id: 'shipped',
      name: 'Order Shipped',
      description: 'Sent when order is shipped with tracking info',
      icon: Truck,
      color: 'bg-blue-600 hover:bg-blue-700',
      category: 'customer'
    },
    {
      id: 'pickup',
      name: 'Ready for Pickup',
      description: 'Sent for local pickup orders when ready',
      icon: Bell,
      color: 'bg-cyan-600 hover:bg-cyan-700',
      category: 'customer'
    },
    {
      id: 'admin_new_order',
      name: 'New Order Alert (Admin)',
      description: 'Internal notification sent to admin on new orders',
      icon: AlertCircle,
      color: 'bg-orange-600 hover:bg-orange-700',
      category: 'internal'
    }
  ];

  const customerEmails = emailTypes.filter(e => e.category === 'customer');
  const internalEmails = emailTypes.filter(e => e.category === 'internal');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Test Email Notifications</h1>
          <p className="text-gray-400 mt-1">Send test emails to verify templates and delivery</p>
        </div>
        <Link href="/admin/email">
          <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
            <Mail className="h-4 w-4 mr-2" />
            Email Manager
          </Button>
        </Link>
      </div>

      {/* Recipient Email - Always Required */}
      <Card className="dash-glass-card border-gray-700">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <User className="h-5 w-5 text-cyan-400" />
            Test Recipient
          </CardTitle>
          <CardDescription className="text-gray-400">
            All test emails will be sent to this address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input 
              type="email"
              value={testEmail} 
              onChange={(e) => setTestEmail(e.target.value)} 
              placeholder="your.email@example.com"
              className="bg-gray-900/50 border-gray-700 text-white flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="quick" className="space-y-6">
        <TabsList className="bg-gray-900/50 border border-gray-700">
          <TabsTrigger value="quick" className="data-[state=active]:bg-cyan-600">
            Quick Test (Mock Data)
          </TabsTrigger>
          <TabsTrigger value="order" className="data-[state=active]:bg-cyan-600">
            Test with Real Order
          </TabsTrigger>
        </TabsList>

        {/* Quick Test - No Order Required */}
        <TabsContent value="quick" className="space-y-6">
          <Card className="dash-glass-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Customer Notifications</CardTitle>
              <CardDescription className="text-gray-400">
                Test emails that customers receive. Uses sample order data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerEmails.map((email) => (
                  <Button 
                    key={email.id}
                    onClick={() => sendPureTest(email.id)} 
                    disabled={loading !== null}
                    className={`${email.color} h-auto py-4 flex flex-col items-start gap-1`}
                  >
                    <div className="flex items-center gap-2">
                      <email.icon className="h-5 w-5" />
                      <span className="font-semibold">{email.name}</span>
                    </div>
                    <span className="text-xs opacity-80 text-left">{email.description}</span>
                    {loading === email.id && <span className="text-xs">Sending...</span>}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="dash-glass-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Internal Notifications</CardTitle>
              <CardDescription className="text-gray-400">
                Admin/internal alert emails. These normally go to your admin email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {internalEmails.map((email) => (
                  <Button 
                    key={email.id}
                    onClick={() => sendPureTest(email.id)} 
                    disabled={loading !== null}
                    className={`${email.color} h-auto py-4 flex flex-col items-start gap-1`}
                  >
                    <div className="flex items-center gap-2">
                      <email.icon className="h-5 w-5" />
                      <span className="font-semibold">{email.name}</span>
                    </div>
                    <span className="text-xs opacity-80 text-left">{email.description}</span>
                    {loading === email.id && <span className="text-xs">Sending...</span>}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test with Real Order */}
        <TabsContent value="order" className="space-y-6">
          <Card className="dash-glass-card border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">Use Real Order Data</CardTitle>
              <CardDescription className="text-gray-400">
                Test emails using actual order information from Firestore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300">Order ID</Label>
                <Input 
                  value={orderId} 
                  onChange={(e) => setOrderId(e.target.value)} 
                  placeholder="Enter an existing Order ID"
                  className="bg-gray-900/50 border-gray-700 text-white mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Find order IDs in the <Link href="/admin/orders" className="text-cyan-400 hover:underline">Orders</Link> page
                </p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Customer Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customerEmails.map((email) => (
                    <Button 
                      key={email.id}
                      onClick={() => sendTestWithOrder(email.id)} 
                      disabled={loading !== null || !orderId}
                      variant="outline"
                      className="border-gray-700 hover:bg-gray-800 h-auto py-3 flex items-center gap-2 justify-start"
                    >
                      <email.icon className="h-4 w-4 text-gray-400" />
                      <span>{email.name}</span>
                      {loading === email.id && <span className="text-xs text-gray-500 ml-auto">Sending...</span>}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Internal Notifications</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {internalEmails.map((email) => (
                    <Button 
                      key={email.id}
                      onClick={() => sendTestWithOrder(email.id)} 
                      disabled={loading !== null || !orderId}
                      variant="outline"
                      className="border-gray-700 hover:bg-gray-800 h-auto py-3 flex items-center gap-2 justify-start"
                    >
                      <email.icon className="h-4 w-4 text-gray-400" />
                      <span>{email.name}</span>
                      {loading === email.id && <span className="text-xs text-gray-500 ml-auto">Sending...</span>}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}