import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Attend-II - AI Face Recognition',
  description: 'AI-Powered Face Recognition Attendance System',
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