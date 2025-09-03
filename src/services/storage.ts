
'use client';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image file to Firebase Storage.
 * @param file - The image file to upload.
 * @param userId - The ID of the user uploading the file.
 * @returns The download URL of the uploaded image.
 */
export async function uploadImage(file: File, userId: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }
  if (!userId) {
    throw new Error('User must be authenticated to upload images.');
  }

  // Create a unique filename
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const storageRef = ref(storage, `uploads/${userId}/${fileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image to Firebase Storage:', error);
    if (error.code === 'storage/unauthorized') {
        throw new Error('Permission denied. Please check your Storage security rules.');
    }
    throw new Error('Failed to upload image. Please try again.');
  }
}
