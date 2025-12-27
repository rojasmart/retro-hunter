import Link from "next/link";
import AuthButton from "@/components/auth/AuthButton";

export default function Pricing() {
  return (
    <div className="w-screen h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-800/90 to-gray-900/90 backdrop-blur-md shadow-md border-b border-gray-700 z-50">
        <Link href="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            RETRO HUNTER
          </h1>
          <span className="text-sm text-cyan-300 tracking-wide">Hunt, Decide, Sell</span>
        </Link>
        <nav className="flex items-center space-x-6">
          <Link href="/about" className="text-cyan-300 hover:text-pink-400 transition-colors">
            About
          </Link>
          <Link href="/pricing" className="text-pink-400 font-bold">
            Pricing
          </Link>
          <AuthButton />
        </nav>
      </header>

      {/* Content */}
      <main className="w-full h-full pt-16 overflow-y-auto">
        <div className="pt-16 pb-20 px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 via-pink-400 to-purple-400 bg-clip-text text-transparent text-center">
              Pricing Plans
            </h1>
            <p className="text-xl text-cyan-300 text-center mb-12">Choose the perfect plan for your retro gaming journey</p>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Free Plan */}
              <div className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30 hover:border-cyan-400/60 transition-all duration-300 transform hover:scale-105">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-cyan-400 mb-2">Free</h3>
                  <div className="text-4xl font-bold text-white mb-2">$0</div>
                  <p className="text-gray-400">Forever free</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Up to 10 price checks per day</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Basic OCR functionality</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Save up to 50 games</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Community support</span>
                  </li>
                </ul>
                <Link
                  href="/"
                  className="block text-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
                >
                  Get Started
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-pink-400/50 hover:border-pink-400/80 transition-all duration-300 transform hover:scale-105 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1 rounded-full text-sm font-bold">
                  POPULAR
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-pink-400 mb-2">Pro</h3>
                  <div className="text-4xl font-bold text-white mb-2">$9.99</div>
                  <p className="text-gray-400">per month</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Unlimited price checks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Advanced OCR with batch upload</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Unlimited game storage</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Price history charts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Export to CSV/PDF</span>
                  </li>
                </ul>
                <Link
                  href="/"
                  className="block text-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
                >
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-purple-400/30 hover:border-purple-400/60 transition-all duration-300 transform hover:scale-105">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-purple-400 mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-white mb-2">Custom</div>
                  <p className="text-gray-400">Contact us</p>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Custom API access</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">SLA guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <span className="text-gray-300">Team training</span>
                  </li>
                </ul>
                <Link
                  href="/"
                  className="block text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

            {/* FAQ */}
            <section className="backdrop-blur-sm bg-gray-800/50 rounded-2xl p-8 border-2 border-cyan-400/30">
              <h2 className="text-3xl font-bold text-pink-400 mb-6 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6 text-gray-300">
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">Can I change plans later?</h3>
                  <p>Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">Is there a free trial?</h3>
                  <p>Pro plan includes a 14-day free trial. No credit card required to start.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">What payment methods do you accept?</h3>
                  <p>We accept all major credit cards, PayPal, and cryptocurrency.</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-cyan-400 mb-2">Can I cancel anytime?</h3>
                  <p>Absolutely! Cancel your subscription at any time with no penalties or hidden fees.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
