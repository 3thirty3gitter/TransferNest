'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Trash2, Save, X, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSignaturesAction, saveSignatureAction, deleteSignatureAction } from '@/lib/actions/signature-actions';
import { Signature } from '@/lib/services/signature-service';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-32 w-full bg-muted animate-pulse rounded-md" />
});

interface SignatureManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function SignatureManager({ isOpen, onClose, onUpdate }: SignatureManagerProps) {
  const { toast } = useToast();
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  
  // Form state
  const [newName, setNewName] = useState('');
  const [newHtml, setNewHtml] = useState('');
  const [saving, setSaving] = useState(false);

  const modules = useMemo(() => ({
    toolbar: [
      ['bold', 'italic', 'underline', 'link'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  const loadSignatures = async () => {
    setLoading(true);
    const result = await getSignaturesAction();
    if (result.success && result.signatures) {
      setSignatures(result.signatures);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadSignatures();
      setView('list');
      setNewName('');
      setNewHtml('');
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!newName.trim()) {
      toast({ title: 'Name required', description: 'Please give your signature a name', variant: 'destructive' });
      return;
    }
    if (!newHtml.trim()) {
      toast({ title: 'Content required', description: 'Please add some content to your signature', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const result = await saveSignatureAction(newName, newHtml);
    setSaving(false);

    if (result.success) {
      toast({ title: 'Signature saved' });
      await loadSignatures();
      setView('list');
      setNewName('');
      setNewHtml('');
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) return;

    const result = await deleteSignatureAction(id);
    if (result.success) {
      toast({ title: 'Signature deleted' });
      await loadSignatures();
      onUpdate();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Signatures</DialogTitle>
          <DialogDescription>
            Create and manage your email signatures.
          </DialogDescription>
        </DialogHeader>

        {view === 'list' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setView('create')} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Signature
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md p-4">
              {loading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : signatures.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No signatures found. Create one to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="flex items-start justify-between p-3 border rounded-lg bg-card">
                      <div className="space-y-1 overflow-hidden">
                        <div className="font-medium flex items-center gap-2">
                          {sig.name}
                          {sig.isDefault && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Default</span>}
                        </div>
                        <div 
                          className="text-xs text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: sig.html }}
                        />
                      </div>
                      {!sig.isDefault && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/90"
                          onClick={() => handleDelete(sig.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Signature Name</Label>
              <Input 
                placeholder="e.g., Professional, Short, Holiday" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <div className="bg-background">
                <ReactQuill
                  theme="snow"
                  value={newHtml}
                  onChange={setNewHtml}
                  modules={modules}
                  className="h-[200px] mb-12"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setView('list')} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Signature
              </Button>
            </div>
          </div>
        )}

        {view === 'list' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
