import legasiLogo from "@/assets/legasi-logo.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-legasi-dark py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <a href="/" className="inline-block">
              <img src={legasiLogo} alt="Legasi" className="h-10 cursor-pointer" />
            </a>
            <p className="text-sm text-muted-foreground">
              Unlock liquidity from your crypto with instant, secure loans.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="/#simulator" className="hover:text-legasi-orange transition-colors">
                  Simulator
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-legasi-orange transition-colors">
                  How it Works
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-legasi-orange transition-colors">
                  Supported Assets
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://www.legasi.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-legasi-orange transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="https://www.legasi.io/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:text-legasi-orange transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="https://www.legasi.io/mentions-legales" target="_blank" rel="noopener noreferrer" className="hover:text-legasi-orange transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://meetings-eu1.hubspot.com/valentin-pouzolles?uuid=db4ae26e-2cfb-4350-9353-48aa912dd491" target="_blank" rel="noopener noreferrer" className="hover:text-legasi-orange transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="mailto:contact@legasi.io" className="hover:text-legasi-orange transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="https://www.legasi.io/resources/faq" target="_blank" rel="noopener noreferrer" className="hover:text-legasi-orange transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.linkedin.com/company/legasi-io/about/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-legasi-orange transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
            <a 
              href="https://x.com/legasi_xyz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-legasi-orange transition-colors"
              aria-label="X (Twitter)"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://www.legasi.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-legasi-orange transition-colors"
              aria-label="Legasi Website"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>
            © 2025 Legasi. Built with ❤️ by{" "}
            <a 
              href="https://www.automatisable.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-legasi-orange hover:underline"
            >
              Automatisable.com
            </a>
            {" "}for all crypto holders.
          </p>
        </div>
      </div>
    </footer>
  );
}
