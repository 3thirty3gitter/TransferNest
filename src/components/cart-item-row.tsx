
'use client';

import type { CartItem } from '@/app/schema';
import SheetPreview from './sheet-preview';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

type CartItemRowProps = {
  item: CartItem;
  onRemove: (docId: string) => void;
};

export default function CartItemRow({ item, onRemove }: CartItemRowProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 border p-4 rounded-lg">
      <div className="w-full md:w-1/3 aspect-video bg-muted rounded-md overflow-hidden relative">
         <div className="transform scale-[0.2] origin-top-left absolute">
            <SheetPreview 
                sheetWidth={item.sheetWidth}
                sheetLength={item.sheetLength}
                nestedLayout={item.layout}
                isLoading={false}
            />
         </div>
      </div>
      <div className="flex-1 flex justify-between">
        <div>
          <h4 className="font-semibold">Custom Gang Sheet</h4>
          <p className="text-sm text-muted-foreground">
            {item.sheetWidth}" x {item.sheetLength.toFixed(2)}"
          </p>
        </div>
        <div className="flex flex-col items-end justify-between">
          <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onRemove(item.id!)}>
            <Trash2 className="mr-2 h-4 w-4"/>
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
