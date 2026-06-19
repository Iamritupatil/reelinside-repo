"use client"

import { useState, type FormEvent } from "react"
import { Check, Search } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

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
      const { data, error } = await supabaseBrowser.rpc("join_waitlist", {
        p_email: trimmed,
        p_website: "",
      })

      if (error) throw new Error("Something went wrong. Please try again.")

      switch (data) {
        case "ok":
          setSubmitted(true)
          setSuccessMessage("You're on the list.")
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

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 ring-1 ring-primary/40">
          <Check className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <p className="text-lg text-white">{successMessage || "You're on the list."}</p>
        <p className="text-sm text-white/70 text-balance">
          We&apos;ll email you at {email} when your spot is ready.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg" noValidate>
      <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 p-1.5 pl-5 shadow-lg backdrop-blur-md">
        <Search className="h-5 w-5 shrink-0 text-white/60" aria-hidden="true" />
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="Enter your email..."
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError("")
          }}
          disabled={isSubmitting}
          className="h-11 flex-1 bg-transparent text-white placeholder:text-white/55 outline-none disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-11 shrink-0 rounded-full bg-white px-6 font-semibold text-black transition hover:bg-white/90 active:scale-[0.98]"
        >
          {isSubmitting ? "Joining..." : "Join Waitlist"}
        </button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-white/85" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
