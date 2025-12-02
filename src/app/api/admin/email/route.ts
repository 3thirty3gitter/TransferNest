import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getEmails, markEmailAsRead } from '@/lib/microsoft-graph';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const emails = await getEmails();
    return NextResponse.json({ emails });
  } catch (error: any) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const { messageId, action } = await request.json();

    if (action === 'markRead') {
      await markEmailAsRead(messageId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update email' },
      { status: 500 }
    );
  }
}
