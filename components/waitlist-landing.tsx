"use client"

import { useState, useEffect, useCallback, type FormEvent } from "react"
import Image from "next/image"
import { getSupabaseBrowser } from "@/lib/supabase/client"

const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

export function WaitlistLanding() {
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("") // honeypot — must stay empty
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [count, setCount] = useState<number | null>(null)

  // Safe public count via a SECURITY DEFINER function — never exposes emails.
  const fetchCount = useCallback(async () => {
    const { data, error } = await getSupabaseBrowser()!.rpc("waitlist_count")
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
      // Calls the SECURITY DEFINER function directly with the anon key. All
      // enforcement (rate limit / format / disposable / honeypot) lives in the
      // DB, so this is the only — and safe — path in.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (getSupabaseBrowser() as any).rpc("join_waitlist", {
        p_email: trimmed,
        p_website: website,
      })

      if (error) throw new Error("Something went wrong. Please try again.")

      switch (data) {
        case "ok":
          setSubmitted(true)
          setEmail("")
          fetchCount()
          setTimeout(() => setSubmitted(false), 3000)
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
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      {/* Grainy green/teal gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_45%_at_72%_12%,rgba(34,197,94,0.40),transparent_70%),radial-gradient(55%_45%_at_25%_12%,rgba(13,148,136,0.30),transparent_70%),linear-gradient(180deg,#0a1a12_0%,#050b08_42%,#000_82%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay" style={{ backgroundImage: NOISE }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* Logo + brand name (no background) */}
        <div className="flex flex-col items-center">
          <Image
            src="/assets/reelinside.png"
            alt="ReelInside"
            width={180}
            height={180}
            priority
            className="h-28 w-28 object-contain drop-shadow-[0_0_45px_rgba(34,197,94,0.5)] sm:h-32 sm:w-32"
          />
          <span className="-mt-3 text-2xl font-bold tracking-tight text-white">Reel Inside</span>
        </div>

        {/* Heading */}
        <h1 className="mt-8 bg-gradient-to-b from-white to-white/40 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl md:text-7xl">
          Join the waitlist
        </h1>

        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-gray-400 sm:text-lg">
          Reel Inside turns your videos into viral-ready scripts — generating hooks, scripts, and
          formats built to get views. Join the waitlist for early access.
        </p>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 flex w-full max-w-xl flex-col items-center justify-center gap-3 sm:flex-row"
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
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
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
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3.5 text-white placeholder-gray-500 outline-none transition-colors focus:border-white/30 disabled:cursor-not-allowed sm:w-80"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-white px-6 py-3.5 font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-70 sm:w-auto"
          >
            {isSubmitting ? "Joining..." : submitted ? "Joined!" : "Join waitlist"}
          </button>
        </form>

        {error ? (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {count !== null && count > 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            <span className="font-semibold text-gray-300">{count.toLocaleString()}</span> already joined
          </p>
        ) : null}
      </div>
    </div>
  )
}
