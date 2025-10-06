
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wand2, ShoppingCart, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


type SheetConfigProps = {
  sheetWidth: 13 | 17;
  sheetLength: number;
  price: number;
  onArrange: () => void;
  onAddToCart: () => void;
  isLoading: boolean;
  hasImages: boolean;
  strategy?: string;
  efficiency: number;
};

export default function SheetConfig({
  sheetWidth,
  sheetLength,
  price,
  onArrange,
  onAddToCart,
  isLoading,
  hasImages,
  strategy,
  efficiency,
}: SheetConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Nesting Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center bg-muted p-3 rounded-md">
            <span className="font-bold">Sheet Width:</span>
            <span className="text-2xl font-bold text-primary">{sheetWidth}"</span>
          </div>
        </div>
        <Button onClick={onArrange} disabled={isLoading || !hasImages} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Arrange Images
        </Button>
      </CardContent>
      <Separator />
      <CardFooter className="flex-col items-start gap-4 pt-6">
        <div className="w-full flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Calculated Length:</span>
          <span className="font-bold">{sheetLength > 0 ? `${sheetLength.toFixed(2)}"` : 'N/A'}</span>
        </div>
        <div className="w-full flex justify-between items-center text-sm">
          <div className="text-muted-foreground flex items-center">
            <span>Packing Efficiency:</span>
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="ml-1.5 h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agent chose <strong>{strategy || 'N/A'}</strong>. Higher is better.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="font-bold">{efficiency > 0 ? `${(efficiency * 100).toFixed(1)}%` : 'N/A'}</span>
        </div>
        <div className="w-full flex justify-between items-baseline">
          <span className="text-muted-foreground">Estimated Price:</span>
          <span className="text-2xl font-bold text-primary">${price.toFixed(2)}</span>
        </div>
        <Button onClick={onAddToCart} disabled={isLoading || sheetLength === 0} className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
           {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-2 h-4 w-4" />
          )}
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
