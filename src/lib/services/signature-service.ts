import { getCompanySettings, updateCompanySettings, EmailSignature } from '@/lib/company-settings';
import { v4 as uuidv4 } from 'uuid';

export interface Signature {
  id: string;
  name: string;
  html: string;
  isDefault: boolean;
}

export async function getSignatures(): Promise<Signature[]> {
  const settings = await getCompanySettings();
  if (!settings?.email?.signatures) return [];
  
  return settings.email.signatures.map(s => ({
    id: s.id,
    name: s.name,
    html: s.content,
    isDefault: s.isDefault
  }));
}

export async function saveSignature(name: string, html: string): Promise<Signature> {
  const settings = await getCompanySettings();
  if (!settings) throw new Error('Settings not found');

  const newSignature: EmailSignature = {
    id: uuidv4(),
    name,
    content: html,
    isDefault: false
  };

  const currentSignatures = settings.email.signatures || [];
  const updatedSignatures = [...currentSignatures, newSignature];

  await updateCompanySettings({
    email: {
      ...settings.email,
      signatures: updatedSignatures
    }
  });

  return {
    id: newSignature.id,
    name: newSignature.name,
    html: newSignature.content,
    isDefault: newSignature.isDefault
  };
}

export async function deleteSignature(id: string): Promise<void> {
  const settings = await getCompanySettings();
  if (!settings?.email?.signatures) return;

  const updatedSignatures = settings.email.signatures.filter(s => s.id !== id);

  await updateCompanySettings({
    email: {
      ...settings.email,
      signatures: updatedSignatures
    }
  });
}
