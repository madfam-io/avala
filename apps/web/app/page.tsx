import { redirect } from 'next/navigation';

export default function HomePage() {
  // For now, redirect to login
  // In production, this would check auth status
  redirect('/login');
}
