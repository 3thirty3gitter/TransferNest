'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CopyrightModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CopyrightModal({ open, onClose }: CopyrightModalProps) {
  const [accepted, setAccepted] = useState(false);
  const router = useRouter();

  const handleAccept = () => {
    if (accepted) {
      router.push('/checkout');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Copyright Agreement</DialogTitle>
          <DialogDescription className="text-slate-400">
            Please confirm you have the rights to print these designs.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 border-2 border-red-500/30 rounded-lg bg-red-500/5 my-4">
          <div className="flex items-start space-x-3">
            <Checkbox 
              id="copyright-terms-modal"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked as boolean)}
              className="mt-1 border-red-400 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            />
            <div className="flex-1">
              <label 
                htmlFor="copyright-terms-modal" 
                className="text-sm leading-relaxed cursor-pointer text-slate-200"
              >
                <strong className="block mb-2 text-red-400">Intellectual Property Warranty:</strong>
                I hereby certify and warrant that I am the rightful owner of, or have obtained all necessary licenses, permissions, and rights to reproduce, print, and distribute all images and designs submitted for production. I understand and agree that I am solely responsible for ensuring all submitted content does not infringe upon any copyright, trademark, patent, trade secret, or other intellectual property rights of any third party.
                <span className="block mt-2 text-blue-400">
                  By checking this box, you agree to our{' '}
                  <Link href="/terms" target="_blank" className="underline hover:text-blue-300">
                    full Terms of Service
                  </Link>.
                </span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10">
            Cancel
          </Button>
          <Button 
            onClick={handleAccept} 
            disabled={!accepted}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold shadow-lg shadow-green-500/20"
          >
            Accept & Checkout <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
