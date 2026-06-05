import Navbar from './Navbar.jsx'
import Footer from './Footer.jsx'

export default function PolicyLayout({ title, lastUpdated, children }) {
  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 pb-28 md:pb-12">
        <h1 className="font-serif text-3xl md:text-4xl text-jewel-dark mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-jewel-muted text-xs mb-8">Last updated: {lastUpdated}</p>
        )}
        <div className="prose prose-sm max-w-none space-y-6 text-jewel-dark">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Reusable section components
export function Section({ title, children }) {
  return (
    <div>
      <h2 className="font-serif text-xl text-jewel-dark mb-2 mt-6">{title}</h2>
      <div className="text-sm text-jewel-muted leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export function Highlight({ children }) {
  return (
    <div className="bg-blush/40 border border-rose-gold/20 rounded-xl px-4 py-3 text-sm text-jewel-dark leading-relaxed">
      {children}
    </div>
  )
}
