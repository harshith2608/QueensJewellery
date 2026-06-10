import logo from '../../assets/logo.png'

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center px-6 py-16">
      <div className="flex flex-col items-center gap-3 mb-10">
        <img src={logo} alt="Queens Jewellery" className="h-24 w-auto" />
        <h1 className="font-serif text-3xl sm:text-4xl text-rose-gold tracking-wide">
          Queens Jewellery
        </h1>
      </div>

      <div className="text-center space-y-3 mb-8">
        <h2 className="font-serif text-4xl sm:text-5xl text-jewel-dark">
          Coming Soon
        </h2>
        <p className="text-jewel-muted text-sm sm:text-base max-w-sm mx-auto leading-relaxed">
          We're putting the finishing touches on something beautiful.
          Stay tuned — we'll be live very soon!
        </p>
      </div>

      <div className="w-16 h-px bg-rose-gold/30 mb-8" />

      <p className="text-xs text-jewel-muted tracking-widest uppercase">
        Traditional &amp; Bridal Jewellery
      </p>
    </div>
  )
}
