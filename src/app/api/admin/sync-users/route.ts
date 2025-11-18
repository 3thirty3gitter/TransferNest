import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from '@/lib/firebase-admin';

/**
 * Admin endpoint to check Firebase Auth users vs Firestore users
 * This helps identify users who exist in Auth but not in Firestore
 */
export async function GET(request: NextRequest) {
  try {
    const admin = require('firebase-admin');
    const db = getFirestore();
    
    // Get all Firebase Auth users
    const listUsersResult = await admin.auth().listUsers(1000);
    const authUsers = listUsersResult.users;
    
    console.log(`[Sync Users] Found ${authUsers.length} users in Firebase Auth`);
    
    // Get all Firestore user documents
    const usersSnapshot = await db.collection('users').get();
    const firestoreUserIds = new Set(usersSnapshot.docs.map((doc: any) => doc.id));
    
    console.log(`[Sync Users] Found ${firestoreUserIds.size} users in Firestore`);
    
    // Find users missing from Firestore
    const missingUsers = authUsers.filter((user: any) => !firestoreUserIds.has(user.uid));
    
    console.log(`[Sync Users] Found ${missingUsers.length} users missing from Firestore`);
    
    // Create Firestore documents for missing users
    const batch = db.batch();
    let createdCount = 0;
    
    for (const user of missingUsers) {
      const userRef = db.collection('users').doc(user.uid);
      
      // Parse display name
      const nameParts = user.displayName?.split(' ') || ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      batch.set(userRef, {
        firstName,
        lastName,
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Canada',
        createdAt: user.metadata.creationTime || new Date().toISOString(),
        syncedFromAuth: true,
      });
      
      createdCount++;
      console.log(`[Sync Users] Preparing to create Firestore doc for: ${user.email}`);
    }
    
    if (createdCount > 0) {
      await batch.commit();
      console.log(`[Sync Users] Successfully created ${createdCount} Firestore documents`);
    }
    
    return NextResponse.json({
      success: true,
      authUsersCount: authUsers.length,
      firestoreUsersCount: firestoreUserIds.size,
      missingUsersCount: missingUsers.length,
      createdCount,
      missingUsers: missingUsers.map((u: any) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        createdAt: u.metadata.creationTime,
      })),
      message: createdCount > 0 
        ? `Successfully synced ${createdCount} users from Auth to Firestore` 
        : 'All Auth users already have Firestore documents',
    });
    
  } catch (error) {
    console.error('[Sync Users] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to sync users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
