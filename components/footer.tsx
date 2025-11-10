import Link from "next/link"
import { Github, Twitter, FileText, Mail } from "lucide-react"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="glass-strong border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/legasi-logo-v3QGuhNk-mHOEKJWIY8d63nTjkCxbFV8jIkhcHb.png"
              alt="Legasi"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              Institutional-grade credit layer on Stellar. Build compliant lending with Soroban smart contracts.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Powered by</span>
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stellar%20logo-p5hq9AV9z4XuQrSSnIOajetCw7pUrV.png"
                alt="Stellar"
                width={80}
                height={24}
                className="h-5 w-auto opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/api-docs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  API Reference
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Stellar Network
                </a>
              </li>
              <li>
                <a
                  href="https://soroban.stellar.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Soroban Docs
                </a>
              </li>
              <li>
                <a
                  href="https://fireblocks.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Fireblocks
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glow-primary transition-all"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glow-accent transition-all"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="/docs"
                className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glow-secondary transition-all"
              >
                <FileText className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@legasi.xyz"
                className="w-10 h-10 glass rounded-full flex items-center justify-center hover:glow-primary transition-all"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <p className="text-sm text-muted-foreground">© 2025 Legasi. Built on</p>
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/stellar%20logo-p5hq9AV9z4XuQrSSnIOajetCw7pUrV.png"
              alt="Stellar"
              width={70}
              height={22}
              className="h-4 w-auto opacity-70"
            />
            <span className="text-sm text-muted-foreground">with Soroban</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
