'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Loader2, Wand2, ShoppingCart } from 'lucide-react';

type SheetConfigProps = {
  sheetWidth: 13 | 17;
  onSheetWidthChange: (width: 13 | 17) => void;
  sheetLength: number;
  price: number;
  onArrange: () => void;
  onAddToCart: () => void;
  isLoading: boolean;
  hasImages: boolean;
};

export default function SheetConfig({
  sheetWidth,
  onSheetWidthChange,
  sheetLength,
  price,
  onArrange,
  onAddToCart,
  isLoading,
  hasImages,
}: SheetConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl">Configure Sheet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="font-bold">Sheet Width</Label>
          <RadioGroup
            value={sheetWidth.toString()}
            onValueChange={(value) => onSheetWidthChange(parseInt(value) as 13 | 17)}
            className="mt-2 grid grid-cols-2 gap-4"
            disabled={isLoading}
          >
            {[13, 17].map((width) => (
              <Label key={width}
                htmlFor={`width-${width}`}
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <RadioGroupItem value={width.toString()} id={`width-${width}`} className="sr-only" />
                <span className="text-2xl font-bold">{width}"</span>
                <span className="text-sm text-muted-foreground">Wide</span>
              </Label>
            ))}
          </RadioGroup>
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
        <div className="w-full flex justify-between items-baseline">
          <span className="text-muted-foreground">Estimated Price:</span>
          <span className="text-2xl font-bold text-primary">${price.toFixed(2)}</span>
        </div>
        <Button onClick={onAddToCart} disabled={isLoading || sheetLength === 0} className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
