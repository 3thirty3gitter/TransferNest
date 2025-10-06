
import { redirect } from 'next/navigation';

export default function NestingToolPage() {
  // This page is now obsolete, redirect to the default 13-inch tool.
  redirect('/nesting-tool-13');
}
