'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

 useEffect(() => {
  if (!isLoaded) return

  async function checkProfile() {
    if (!isSignedIn) {
      setChecking(false)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', user!.id)
      .maybeSingle()

    if (!data) {
      router.push('/onboarding')
    } else {
      setChecking(false)
    }
  }

  checkProfile()
 },[isLoaded, isSignedIn, user, router])

  if (!isLoaded || checking) {
    return (
      <main className="min-h-screen bg-[#3B0A0A] flex items-center justify-center">
        <p className="text-[#FDF3E3]" style={{ fontFamily: 'var(--font-body)' }}>Loading...</p>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#3B0A0A] flex flex-col items-center justify-center px-6">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F2A93B]/20 blur-3xl" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-[#D4A017]/15 blur-3xl" style={{ animation: 'float 10s ease-in-out infinite 1s' }} />

      <div className="absolute top-6 right-6 z-20">
        <Show when="signed-out">
          <div className="flex gap-3" style={{ animation: 'fadeInUp 0.7s ease-out 0.3s both' }}>
            <SignInButton mode="modal">
              <button className="px-5 py-2 rounded-full border border-[#D4A017]/60 text-[#FDF3E3] font-medium text-sm hover:bg-[#D4A017]/10 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-5 py-2 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold text-sm hover:bg-[#F2A93B]/90 transition-colors" style={{ fontFamily: 'var(--font-body)' }}>
                Sign up
              </button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>

      <svg
        width="360"
        height="70"
        viewBox="0 0 360 70"
        className="mb-2 z-10"
        style={{ animation: 'sway 4s ease-in-out infinite', transformOrigin: 'top center' }}
      >
        <path d="M 10 5 Q 180 55 350 5" stroke="#D4A017" strokeWidth="2" fill="none" opacity="0.6" />
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 10 + i * 42.5
          const t = i / 8
          const y = 5 + Math.sin(t * Math.PI) * 46
          return (
            <g key={i} style={{ animation: `flicker ${2 + (i % 3) * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}>
              <circle cx={x} cy={y} r="7" fill="#F2A93B" />
              <circle cx={x} cy={y} r="3" fill="#D4A017" />
            </g>
          )
        })}
      </svg>

      <div className="text-center z-10" style={{ animation: 'fadeInUp 0.8s ease-out 0.15s both' }}>
        <h1 className="text-6xl sm:text-7xl text-[#FDF3E3] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
          shaadikrlo.com
        </h1>
        <p className="text-[#F2A93B] text-lg tracking-wide" style={{ fontFamily: 'var(--font-body)', fontWeight: 300 }}>
          Just get married already.
        </p>
      </div>

      <Show when="signed-out">
        <div className="mt-10 z-10" style={{ animation: 'fadeInUp 0.9s ease-out 0.45s both' }}>
          <SignUpButton mode="modal">
            <button className="px-8 py-3 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold text-base hover:bg-[#FDF3E3] transition-colors shadow-lg" style={{ fontFamily: 'var(--font-body)' }}>
              Find your match
            </button>
          </SignUpButton>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="mt-6 z-10 text-[#FDF3E3]" style={{ fontFamily: 'var(--font-body)' }}>
          You&apos;re in. Let&apos;s find your match.
        </div>
      </Show>
    </main>
  )
}