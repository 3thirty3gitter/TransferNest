'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Home, Package } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, you'd fetch order details from your backend
    // For now, we'll just show the confirmation
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        {/* Success Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl"></div>
          <CheckCircle2 className="relative h-24 w-24 text-green-500" />
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
          <p className="text-xl text-muted-foreground">Thank you for your order</p>
        </div>

        {/* Order Details Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Order Number:</span>
              <span className="font-mono font-medium">{orderId}</span>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium">What happens next?</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>You'll receive a confirmation email with your order details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Your print-ready gang sheet files are being prepared</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>We'll notify you when your order is ready for production</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>Track your order status in the Orders section</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 space-y-3">
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => router.push('/orders')}
              >
                <Package className="mr-2 h-4 w-4" />
                View My Orders
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/nesting-tool')}
                >
                  Create Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Message */}
        <p className="text-center text-sm text-muted-foreground max-w-md">
          Have questions about your order? Contact us at{' '}
          <a href="mailto:support@transfernest.com" className="text-primary hover:underline">
            support@transfernest.com
          </a>
        </p>
      </div>
    </div>
  );
}
