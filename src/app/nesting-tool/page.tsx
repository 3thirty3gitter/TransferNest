
import { redirect } from 'next/navigation';

export default async function NestingToolPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const openWizard = resolvedSearchParams.openWizard === 'true';
  const restoreCartItemId = typeof resolvedSearchParams.restore === 'string' ? resolvedSearchParams.restore : undefined;
  
  // Build query string for redirect
  const queryParams = new URLSearchParams();
  if (openWizard) queryParams.set('openWizard', 'true');
  if (restoreCartItemId) queryParams.set('restore', restoreCartItemId);
  
  const queryString = queryParams.toString();
  const redirectUrl = queryString ? `/nesting-tool-17?${queryString}` : '/nesting-tool-17';

  // Redirect to the default 17-inch tool with query params.
  redirect(redirectUrl);
}
