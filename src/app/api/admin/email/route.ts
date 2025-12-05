import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-auth-server';
import { getEmails, markEmailAsRead, sendEmail } from '@/lib/microsoft-graph';

export async function GET(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';
    const emails = await getEmails(folder);
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

export async function POST(request: Request) {
  const auth = await verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.message }, { status: 401 });
  }

  try {
    const { to, subject, content } = await request.json();
    
    if (!to || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await sendEmail(to, subject, content);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
