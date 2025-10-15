import Image from 'next/image';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import type { CartItem } from '@/app/schema';

interface CartItemRowProps {
  item: CartItem;
  onRemove: (docId: string) => Promise<void>;
}

export default function CartItemRow({ item, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <div className="w-12 h-12 relative">
        <Image
          src={item.pngUrl || "/placeholder-transfer.jpg"}
          alt="Transfer"
          fill
          className="object-cover rounded"
          sizes="(max-width: 768px) 100vw, 12rem"
        />
      </div>
      <div className="flex-1 flex justify-between items-center">
        <div>
          <h4 className="font-semibold">Custom Gang Sheet</h4>
          <p className="text-sm text-muted-foreground">
            {item.sheetWidth}" x {item.sheetLength.toFixed(1)}" DTF Transfer Sheet
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-semibold">${item.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Qty: 1</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
