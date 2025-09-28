import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'College Attendance - AI System',
  description: 'AI-Powered College Attendance System with Face Recognition',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}