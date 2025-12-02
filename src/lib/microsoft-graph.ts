import { getCompanySettings } from './company-settings';

interface GraphEmail {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  isRead: boolean;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  body: {
    contentType: string;
    content: string;
  };
}

export async function getMicrosoftGraphToken() {
  const settings = await getCompanySettings();
  if (!settings?.email?.enabled || settings.email.provider !== 'microsoft365' || !settings.email.microsoft365) {
    throw new Error('Microsoft 365 integration is not enabled');
  }

  const { tenantId, clientId, clientSecret } = settings.email.microsoft365;

  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('scope', 'https://graph.microsoft.com/.default');
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Token Error:', error);
    throw new Error(`Failed to get access token: ${error.error_description || error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function getEmails(folder = 'inbox', top = 20): Promise<GraphEmail[]> {
  const settings = await getCompanySettings();
  if (!settings?.email?.enabled || settings.email.provider !== 'microsoft365' || !settings.email.microsoft365) {
    throw new Error('Microsoft 365 integration is not enabled');
  }

  const { userEmail } = settings.email.microsoft365;
  const token = await getMicrosoftGraphToken();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userEmail}/mailFolders/${folder}/messages?$top=${top}&$select=id,subject,bodyPreview,receivedDateTime,isRead,from,body&$orderby=receivedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('Graph API Error:', error);
    throw new Error(`Failed to fetch emails: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.value;
}

export async function markEmailAsRead(messageId: string): Promise<void> {
  const settings = await getCompanySettings();
  if (!settings?.email?.enabled || settings.email.provider !== 'microsoft365' || !settings.email.microsoft365) return;

  const { userEmail } = settings.email.microsoft365;
  const token = await getMicrosoftGraphToken();

  await fetch(
    `https://graph.microsoft.com/v1.0/users/${userEmail}/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        isRead: true,
      }),
    }
  );
}
