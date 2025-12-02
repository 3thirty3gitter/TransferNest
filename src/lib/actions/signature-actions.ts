'use server';

import { getSignatures, saveSignature, deleteSignature } from '@/lib/services/signature-service';

export async function getSignaturesAction() {
  try {
    const signatures = await getSignatures();
    return { success: true, signatures };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveSignatureAction(name: string, html: string) {
  try {
    const signature = await saveSignature(name, html);
    return { success: true, signature };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSignatureAction(id: string) {
  try {
    await deleteSignature(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
