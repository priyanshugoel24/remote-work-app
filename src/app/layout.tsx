import type { Metadata } from 'next'
import { ClerkProvider, UserButton } from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Remote Work App',
  description: 'Your remote work platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {/* Show header with UserButton only on authenticated pages */}
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <UserButton afterSignOutUrl="/sign-in" />
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}