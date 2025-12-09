import { redirect } from 'next/navigation';

export default async function AdminPage() {
  // Redirect /admin to root dashboard
  redirect('/');
}