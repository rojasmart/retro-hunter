import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";

export default function About() {
  return (
    <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-md shadow-md border-b border-gray-700 z-50">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            RETRO HUNTER
          </h1>
          <span className="text-sm text-cyan-300 font-mono tracking-wide">Hunt, Decide, Sell</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link href="/about" className="text-pink-400 font-mono font-bold">
            About
          </Link>
          <Link href="/pricing" className="text-cyan-300 hover:text-pink-400 transition-colors font-mono">
            Pricing
          </Link>
          <AuthButton />
        </nav>
      </header>

      {/* Content */}
      <main className="w-full h-full pt-16 overflow-y-auto">
        <div className="pt-16 pb-20 px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-8 bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              About Retro Hunter
            </h1>

            <div className="space-y-8">
              {/* Mission */}
              <section className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30">
                <h2 className="text-3xl font-bold text-pink-400 mb-4 font-mono">Our Mission</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Retro Hunter was created to help retro game collectors and dealers make informed decisions. We believe that buying, selling, and
                  collecting retro games should be backed by accurate pricing data from multiple sources. Our mission is to provide the most
                  comprehensive and user-friendly price comparison tool for retro gaming enthusiasts worldwide.
                </p>
              </section>

              {/* What We Do */}
              <section className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30">
                <h2 className="text-3xl font-bold text-pink-400 mb-4 font-mono">What We Do</h2>
                <div className="space-y-4 text-gray-300 text-lg">
                  <p>
                    <span className="text-cyan-400 font-bold">•</span> <strong className="text-white">Price Aggregation:</strong> We gather pricing
                    data from multiple marketplaces to give you a complete picture of current market values.
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">•</span> <strong className="text-white">OCR Technology:</strong> Our advanced OCR system
                    can extract game titles and platforms from images, making cataloging your collection faster than ever.
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">•</span> <strong className="text-white">Collection Management:</strong> Track your
                    collection, monitor price changes, and see your investments grow over time.
                  </p>
                  <p>
                    <span className="text-cyan-400 font-bold">•</span> <strong className="text-white">Multi-Condition Support:</strong> Get pricing
                    for loose cartridges, complete-in-box (CIB), graded games, and more.
                  </p>
                </div>
              </section>

              {/* Why Choose Us */}
              <section className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30">
                <h2 className="text-3xl font-bold text-pink-400 mb-4 font-mono">Why Choose Retro Hunter?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
                  <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/20">
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">🎯 Accurate Data</h3>
                    <p>Real-time pricing from trusted sources</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/20">
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">⚡ Fast & Easy</h3>
                    <p>Quick searches and intuitive interface</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/20">
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">📱 Mobile Friendly</h3>
                    <p>Access your collection anywhere</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-cyan-400/20">
                    <h3 className="text-xl font-bold text-cyan-400 mb-2">🔐 Secure</h3>
                    <p>Your data is safe and private</p>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30 text-center">
                <h2 className="text-3xl font-bold text-pink-400 mb-4 font-mono">Get Started</h2>
                <p className="text-gray-300 text-lg mb-6">Ready to start hunting for the best retro game prices?</p>
                <Link
                  href="/"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-lg rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 border-2 border-pink-400/50"
                >
                  Start Hunting 🎮
                </Link>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
