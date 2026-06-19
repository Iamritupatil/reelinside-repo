"use client"

import { useState, useEffect, useCallback, type FormEvent } from "react"
import Image from "next/image"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Zap, Film, TrendingUp, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

const features = [
  { icon: Film, label: "Script from video" },
  { icon: Zap, label: "Viral hooks" },
  { icon: TrendingUp, label: "Trend formats" },
]

export function WaitlistLanding() {
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  const fetchCount = useCallback(async () => {
    const client = getSupabaseBrowser()
    if (!client) return
    const { data, error } = await client.rpc("waitlist_count")
    if (!error && typeof data === "number") setCount(data)
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const client = getSupabaseBrowser()
      if (!client) throw new Error("Something went wrong. Please try again.")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (client as any).rpc("join_waitlist", {
        p_email: trimmed,
        p_website: website,
      })

      if (error) throw new Error("Something went wrong. Please try again.")

      switch (data) {
        case "ok":
          setSubmitted(true)
          setEmail("")
          fetchCount()
          break
        case "disposable":
          setError("Disposable email addresses aren't allowed.")
          break
        case "rate_limited":
          setError("Too many attempts. Please try again in a few minutes.")
          break
        default:
          setError("Please enter a valid email address.")
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030a06] font-sans text-white">
      {/* Multi-layer gradient background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top glow orb */}
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        {/* Center accent */}
        <div className="absolute top-1/3 left-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-600/8 blur-[100px]" />
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      {/* Content */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-20">

        {/* Top badge */}
        <div className="mb-8 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Early access — limited spots</span>
        </div>

        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl" />
            <Image
              src="/assets/reelinside.png"
              alt="ReelInside"
              width={64}
              height={64}
              priority
              className="relative h-16 w-16 rounded-2xl object-contain"
            />
          </div>
          <span className="text-sm font-semibold tracking-widest text-white/40 uppercase">Reel Inside</span>
        </div>

        {/* Heading */}
        <h1 className="mt-8 text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="block text-white">Turn your videos</span>
          <span className="block bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
            into viral scripts.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-white/50 sm:text-lg">
          Reel Inside analyzes your footage and generates scroll-stopping hooks, scripts, and
          formats engineered to get views — in seconds.
        </p>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {features.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 backdrop-blur-sm"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
              {label}
            </div>
          ))}
        </div>

        {/* Form */}
        {!submitted ? (
          <div className="mt-10 w-full max-w-lg">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-3 sm:flex-row"
              noValidate
            >
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="absolute left-[-9999px] top-0 h-0 w-0 opacity-0"
              />
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative flex-1">
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                  placeholder="your@email.com"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-white placeholder-white/30 outline-none ring-0 transition-all focus:border-emerald-500/50 focus:bg-white/8 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-black transition-all hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] active:scale-[0.98] disabled:opacity-70"
              >
                {isSubmitting ? "Joining..." : (
                  <>
                    Get early access
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {error ? (
              <p className="mt-3 text-center text-sm text-red-400" role="alert">{error}</p>
            ) : null}

            {count !== null && count > 0 ? (
              <p className="mt-4 text-center text-sm text-white/30">
                <span className="font-semibold text-white/60">{count.toLocaleString()}</span> people already on the list
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-semibold text-white">You&apos;re on the list!</p>
              <p className="mt-1 text-sm text-white/40">We&apos;ll reach out the moment spots open up.</p>
            </div>
            {count !== null && count > 0 ? (
              <p className="text-sm text-white/30">
                You&apos;re among <span className="font-semibold text-white/50">{count.toLocaleString()}</span> people waiting.
              </p>
            ) : null}
          </div>
        )}

        {/* Bottom trust line */}
        <p className="mt-16 text-xs text-white/20">No spam. Unsubscribe anytime. We hate it too.</p>
      </div>
    </div>
  )
}
