import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
    title: 'BloodConnect - Blood Donation Center',
    description: 'Save lives through blood donation. Learn how to donate, find answers to common questions, and register as a donor today.',
    // icons: {
    //     icon: [
    //         {
    //             url: '/icon-light-32x32.png',
    //             media: '(prefers-color-scheme: light)',
    //         },
    //         {
    //             url: '/icon-dark-32x32.png',
    //             media: '(prefers-color-scheme: dark)',
    //         },
    //         {
    //             url: '/icon.svg',
    //             type: 'image/svg+xml',
    //         },
    //     ],
    //     apple: '/apple-icon.png',
    // },
}

export const viewport: Viewport = {
    themeColor: '#c4301c',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        </body>
        </html>
    )
}
