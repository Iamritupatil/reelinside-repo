import Image from "next/image"

const links = ["Solutions", "Technology", "Insight", "Support", "About"]

export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 px-4 pt-5 sm:px-6">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full border border-white/15 bg-black/30 py-1.5 pl-4 pr-2 backdrop-blur-md">
        <a href="/" className="flex shrink-0 items-center gap-2" aria-label="Reel Inside home">
          <Image
            src="/assets/logo.png"
            alt="Reel Inside logo"
            width={56}
            height={56}
            className="h-12 w-12 object-contain"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-white">Reel Inside</span>
        </a>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <li key={link}>
              <a
                href="#waitlist"
                className="text-sm text-white/75 transition-colors hover:text-white"
              >
                {link}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#waitlist"
          className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
        >
          Get Started
        </a>
      </nav>
    </header>
  )
}
