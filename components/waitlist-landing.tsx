"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { ArrowRight, CheckCircle2, Sparkles, Clapperboard, Wand2, BarChart3 } from "lucide-react"

const features = [
  { icon: Clapperboard, title: "Upload any video", desc: "Drop in raw footage from any platform." },
  { icon: Wand2, title: "AI rewrites it", desc: "Hooks, captions & scripts — generated instantly." },
  { icon: BarChart3, title: "Built to go viral", desc: "Formats trained on what's actually trending." },
]

export function WaitlistLanding() {
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const fetchCount = useCallback(async () => {
    const client = getSupabaseBrowser()
    if (!client) return
    const { data, error } = await client.rpc("waitlist_count")
    if (!error && typeof data === "number") setCount(data)
  }, [])

  useEffect(() => { fetchCount() }, [fetchCount])

  async function handleSubmit(e: React.BaseSyntheticEvent) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white font-sans">

      {/* ── Video background ── */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster="/assets/poster.jpg"
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      >
        <source src="/assets/background.mp4" type="video/mp4" />
      </video>

      {/* ── Overlays ── */}
      {/* vignette + bottom fade */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.85)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black to-transparent" />
      {/* green tint orb */}
      <div className="absolute -top-32 left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-600/20 blur-[140px] pointer-events-none" />

      {/* ── Nav ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <Image
            src="/assets/reelinside.png"
            alt="ReelInside logo"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
          <span className="text-sm font-semibold tracking-tight text-white">Reel Inside</span>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Accepting signups
        </span>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-8 text-center">

        {/* badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/60 backdrop-blur-md">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          AI-powered script generation · Early access
        </div>

        {/* heading */}
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl">
          Your videos deserve
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 bg-clip-text text-transparent">
            better scripts.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/50 sm:text-lg">
          Reel Inside turns your raw footage into viral-ready hooks, captions,
          and scripts — in seconds, not hours.
        </p>

        {/* ── Form ── */}
        {submitted ? (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
              <CheckCircle2 className="h-7 w-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">You&apos;re on the list!</p>
              <p className="mt-1 text-sm text-white/40">
                We&apos;ll reach out the moment your spot opens up.
              </p>
            </div>
            {count !== null && count > 0 && (
              <p className="text-sm text-white/30">
                You&apos;re among{" "}
                <span className="font-medium text-white/50">{count.toLocaleString()}</span> waiting.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-10 w-full max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" noValidate>
              {/* honeypot */}
              <input
                type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                value={website} onChange={(e) => setWebsite(e.target.value)}
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email" type="email" inputMode="email" autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError("") }}
                placeholder="your@email.com"
                required disabled={isSubmitting}
                className="h-12 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder-white/25 outline-none backdrop-blur-md transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed"
              />
              <button
                type="submit" disabled={isSubmitting}
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-black transition hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(52,211,153,0.5)] active:scale-[0.97] disabled:opacity-60"
              >
                {isSubmitting ? "Joining…" : (
                  <>Join waitlist <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
            </form>
            {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
            {count !== null && count > 0 && (
              <p className="mt-4 text-xs text-white/30">
                <span className="font-medium text-white/50">{count.toLocaleString()}</span> people already signed up
              </p>
            )}
          </div>
        )}

        {/* ── Feature cards ── */}
        <div className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/8 bg-white/5 p-5 text-left backdrop-blur-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
                <Icon className="h-4.5 w-4.5 text-emerald-400" style={{ height: "18px", width: "18px" }} />
              </div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{desc}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-xs text-white/20">No spam. Unsubscribe anytime.</p>
      </main>
    </div>
  )
}
