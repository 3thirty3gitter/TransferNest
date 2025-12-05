
import { redirect } from 'next/navigation';

export default async function NestingToolPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const openWizard = resolvedSearchParams.openWizard === 'true';
  
  if (openWizard) {
    redirect('/nesting-tool-17?openWizard=true');
  }

  // Redirect to the default 17-inch tool.
  redirect('/nesting-tool-17');
}
