import Image from 'next/image';

export default function CartItemRow() {
  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg">
      <div className="w-12 h-12 relative">
        <Image
          src="/placeholder-transfer.jpg"
          alt="Transfer"
          fill
          className="object-cover rounded"
          sizes="(max-width: 768px) 100vw, 12rem"
        />
      </div>
      <div className="flex-1 flex justify-between">
        <div>
          <h4 className="font-semibold">Custom Gang Sheet</h4>
          <p className="text-sm text-muted-foreground">
            13" x 19" DTF Transfer Sheet
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold">$45.99</p>
          <p className="text-sm text-muted-foreground">Qty: 1</p>
        </div>
      </div>
    </div>
  );
}
