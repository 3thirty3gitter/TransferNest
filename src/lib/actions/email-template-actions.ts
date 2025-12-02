'use server';

import { getEmailTemplates, saveEmailTemplate, EmailTemplate } from '@/lib/services/email-template-service';
import { revalidatePath } from 'next/cache';

export async function getEmailTemplatesAction() {
  try {
    const templates = await getEmailTemplates();
    return { success: true, templates };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveEmailTemplateAction(template: EmailTemplate) {
  try {
    await saveEmailTemplate(template);
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
