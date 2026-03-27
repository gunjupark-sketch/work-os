import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Work OS - Staxion',
  description: 'Project management dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="bg-navy text-white px-6 py-4 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <a href="/" className="text-xl font-bold tracking-tight">
                Work OS
              </a>
              <nav className="flex items-center gap-1 text-sm">
                <a href="/" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-beige/90 hover:text-white">
                  프로젝트
                </a>
                <a href="/chat" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors text-beige/90 hover:text-white">
                  채팅
                </a>
              </nav>
            </div>
            <span className="text-sm text-beige/70">staxion</span>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
