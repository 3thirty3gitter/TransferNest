'use server';

import { executeNesting, VIRTUAL_SHEET_HEIGHT } from '@/lib/nesting-algorithm';

export async function nestImages(images: any[], sheetWidth: number) {
  try {
    const result = executeNesting(images, sheetWidth, VIRTUAL_SHEET_HEIGHT);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
