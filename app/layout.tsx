import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Career Space · Your growth, organized', description: 'Your personal workspace for career notes, interview preparation, and learning resources.' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
