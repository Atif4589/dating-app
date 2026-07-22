'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  name: string
  age: number
  bio: string
  gender: string
  interested_in: string
  location: string
  hobbies: string[]
  height_cm: number | null
  occupation: string
  looking_for: string
  photo_url: string
}

const SWIPE_THRESHOLD = 120
const EXIT_DISTANCE = 800
const EXIT_DURATION = 320 // ms, must match the transition duration below

// Fallback profiles shown only when there are no real candidates left (e.g. empty
// table during dev, or you've swiped through everyone). These are never written to
// Supabase — swiping on them just advances the local demo queue.
const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-1',
    name: 'Ananya',
    age: 26,
    bio: 'Chai over coffee, always. Weekend trekker and amateur pasta chef.',
    gender: 'woman',
    interested_in: 'everyone',
    location: 'Bengaluru',
    hobbies: ['Trekking', 'Cooking', 'Photography'],
    height_cm: 165,
    occupation: 'Product Designer',
    looking_for: 'Something serious',
    photo_url: '',
  },
  {
    id: 'demo-2',
    name: 'Rohan',
    age: 29,
    bio: 'Cricket on weekends, spreadsheets on weekdays. Looking for someone to argue about food with.',
    gender: 'man',
    interested_in: 'everyone',
    location: 'Mumbai',
    hobbies: ['Cricket', 'Reading', 'Foodie'],
    height_cm: 178,
    occupation: 'Software Engineer',
    looking_for: 'Not sure yet',
    photo_url: '',
  },
  {
    id: 'demo-3',
    name: 'Meera',
    age: 24,
    bio: 'Bharatanatyam dancer by training, meme curator by hobby.',
    gender: 'woman',
    interested_in: 'everyone',
    location: 'Delhi',
    hobbies: ['Dance', 'Movies', 'Travel'],
    height_cm: 160,
    occupation: 'Marketing Manager',
    looking_for: 'Something casual',
    photo_url: '',
  },
]

export default function Discover() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()

  const [myProfile, setMyProfile] = useState<Profile | null>(null)
  const [queue, setQueue] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [matchName, setMatchName] = useState<string | null>(null)
  const [loadedPhotos, setLoadedPhotos] = useState<Record<string, boolean>>({})
  const [isDemoQueue, setIsDemoQueue] = useState(false)

  const dragState = useRef({ startX: 0, startY: 0, dragging: false })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  // When set, the top card animates off-screen before actually leaving the queue
  const [exiting, setExiting] = useState<{ id: string; action: 'like' | 'pass' } | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/')
      return
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn])

  async function loadData() {
    setLoading(true)

    const { data: me } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', user!.id)
      .maybeSingle()

    if (!me) {
      router.push('/onboarding')
      return
    }
    setMyProfile(me)

    const { data: mySwipes } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', me.id)

    const swipedIds = new Set((mySwipes || []).map((s) => s.swiped_id))

    let query = supabase.from('profiles').select('*').neq('id', me.id)

    if (me.interested_in !== 'everyone') {
      query = query.eq('gender', me.interested_in)
    }

    const { data: candidates } = await query

    const filtered = (candidates || []).filter((p) => !swipedIds.has(p.id))

    // No real candidates? Fall back to demo profiles so the swipe UI is testable.
    setQueue(filtered.length > 0 ? filtered : DEMO_PROFILES)
    setIsDemoQueue(filtered.length === 0)
    setLoading(false)
  }

  // Actually writes to Supabase and advances the queue. Called after the exit animation finishes.
  async function finalizeSwipe(profile: Profile, action: 'like' | 'pass') {
    if (!myProfile) return

    // Demo profiles aren't real rows — just advance the queue, no DB write.
    if (profile.id.startsWith('demo-')) {
      if (action === 'like') {
        setMatchName(profile.name)
      }
      setQueue((prev) => prev.slice(1))
      setDragOffset({ x: 0, y: 0 })
      setExiting(null)
      return
    }

    const { error } = await supabase.from('swipes').insert({
      swiper_id: myProfile.id,
      swiped_id: profile.id,
      action,
    })

    if (error) {
      console.error('Failed to record swipe:', error.message)
    }

    if (action === 'like') {
      const { data: theirLike } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', profile.id)
        .eq('swiped_id', myProfile.id)
        .eq('action', 'like')
        .maybeSingle()

      if (theirLike) {
        setMatchName(profile.name)
      }
    }

    setQueue((prev) => prev.slice(1))
    setDragOffset({ x: 0, y: 0 })
    setExiting(null)
  }

  // Kicks off the fly-off-screen animation, then finalizes after it completes.
  // Works both for drag-released swipes and button-triggered swipes.
  function triggerSwipe(profile: Profile, action: 'like' | 'pass') {
    setIsDragging(false)
    dragState.current.dragging = false
    setExiting({ id: profile.id, action })

    const flyX = action === 'like' ? EXIT_DISTANCE : -EXIT_DISTANCE
    setDragOffset((prev) => ({ x: flyX, y: prev.y }))

    setTimeout(() => {
      finalizeSwipe(profile, action)
    }, EXIT_DURATION)
  }

  function onPointerDown(e: React.PointerEvent) {
    if (exiting) return
    dragState.current = { startX: e.clientX, startY: e.clientY, dragging: true }
    setIsDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current.dragging) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setDragOffset({ x: dx, y: dy })
  }

  function onPointerUp() {
    if (!dragState.current.dragging) return
    dragState.current.dragging = false
    setIsDragging(false)

    const top = queue[0]

    if (dragOffset.x > SWIPE_THRESHOLD && top) {
      triggerSwipe(top, 'like')
    } else if (dragOffset.x < -SWIPE_THRESHOLD && top) {
      triggerSwipe(top, 'pass')
    } else {
      // Springy snap-back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const current = queue[0]
  const rotation = dragOffset.x / 20

  // Card fades out slightly as it approaches the swipe threshold, so the fly-off
  // doesn't feel abrupt
  const dragFade = Math.max(0, 1 - Math.abs(dragOffset.x) / (SWIPE_THRESHOLD * 3.2))

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#3B0A0A] flex items-center justify-center">
        <p className="text-[#FDF3E3]" style={{ fontFamily: 'var(--font-body)' }}>
          Loading...
        </p>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#3B0A0A] flex flex-col items-center justify-center px-6 py-16">
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F2A93B]/15 blur-3xl"
        style={{ animation: 'float 9s ease-in-out infinite' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 w-[26rem] h-[26rem] rounded-full bg-[#D4A017]/10 blur-3xl"
        style={{ animation: 'float 11s ease-in-out infinite 1s' }}
      />

      <h1
        className="text-3xl text-[#FDF3E3] mb-2 z-10"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Discover
      </h1>

      {isDemoQueue && (
        <p
          className="text-xs text-[#F2A93B] mb-6 z-10 tracking-wide uppercase"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Demo profiles — no real users to show yet
        </p>
      )}

      {matchName && (
        <div className="fixed inset-0 z-50 bg-[#3B0A0A]/90 flex items-center justify-center px-6">
          <div
            className="bg-[#FDF3E3] rounded-3xl p-10 text-center max-w-sm"
            style={{ animation: 'fadeInUp 0.4s ease-out both' }}
          >
            <h2 className="text-3xl text-[#3B0A0A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              It&apos;s a match!
            </h2>
            <p className="text-[#3B0A0A]/70 mb-6" style={{ fontFamily: 'var(--font-body)' }}>
              You and {matchName} both said yes.
            </p>
            <button
              onClick={() => setMatchName(null)}
              className="px-6 py-3 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold hover:bg-[#D4A017] transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Keep swiping
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-sm h-[520px] z-10">
        {!current && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-[#FDF3E3] rounded-3xl shadow-2xl"
            style={{ animation: 'fadeInUp 0.4s ease-out both' }}
          >
            <p className="text-[#3B0A0A]/60 text-center px-8" style={{ fontFamily: 'var(--font-body)' }}>
              No more profiles right now. Check back later.
            </p>
          </div>
        )}

        {queue.slice(0, 3).reverse().map((profile, idx, arr) => {
          const isTop = idx === arr.length - 1
          const isExiting = exiting?.id === profile.id

          // The stack cards behind the top one sit slightly smaller/lower, and step
          // forward smoothly (via the transition below) each time the top card leaves
          const depthFromTop = arr.length - 1 - idx
          const restingTransform = `scale(${1 - depthFromTop * 0.04}) translateY(${depthFromTop * 10}px)`

          const activeTransform = isExiting
            ? `translate(${dragOffset.x}px, ${dragOffset.y - 40}px) rotate(${dragOffset.x / 14}deg)`
            : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`

          return (
            <div
              key={profile.id}
              onPointerDown={isTop && !isExiting ? onPointerDown : undefined}
              onPointerMove={isTop && !isExiting ? onPointerMove : undefined}
              onPointerUp={isTop && !isExiting ? onPointerUp : undefined}
              onPointerLeave={isTop && !isExiting ? onPointerUp : undefined}
              className="absolute inset-0 bg-[#FDF3E3] rounded-3xl shadow-2xl overflow-hidden select-none touch-none"
              style={{
                transform: isTop ? activeTransform : restingTransform,
                opacity: isTop && isDragging ? dragFade : 1,
                transition: isExiting
                  ? `transform ${EXIT_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${EXIT_DURATION}ms ease-out`
                  : isTop && isDragging
                  ? 'none'
                  : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                cursor: isTop ? 'grab' : 'default',
                zIndex: idx,
                willChange: 'transform, opacity',
              }}
            >
              {isTop && !isExiting && dragOffset.x > 40 && (
                <div
                  className="absolute top-6 left-6 z-20 px-4 py-2 rounded-full border-4 border-green-500 text-green-500 font-bold text-xl -rotate-12"
                  style={{ opacity: Math.min(1, (dragOffset.x - 40) / 80) }}
                >
                  LIKE
                </div>
              )}
              {isTop && !isExiting && dragOffset.x < -40 && (
                <div
                  className="absolute top-6 right-6 z-20 px-4 py-2 rounded-full border-4 border-red-500 text-red-500 font-bold text-xl rotate-12"
                  style={{ opacity: Math.min(1, (-dragOffset.x - 40) / 80) }}
                >
                  PASS
                </div>
              )}

              <div className="h-3/5 bg-[#3B0A0A]/10 overflow-hidden">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onLoad={() =>
                      setLoadedPhotos((prev) => ({ ...prev, [profile.id]: true }))
                    }
                    style={{
                      opacity: loadedPhotos[profile.id] ? 1 : 0,
                      transform: loadedPhotos[profile.id] ? 'scale(1)' : 'scale(1.05)',
                      transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-[#3B0A0A]/30 text-6xl"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col gap-2">
                <h2 className="text-2xl text-[#3B0A0A]" style={{ fontFamily: 'var(--font-display)' }}>
                  {profile.name}, {profile.age}
                </h2>
                {profile.occupation && (
                  <p className="text-sm text-[#3B0A0A]/60" style={{ fontFamily: 'var(--font-body)' }}>
                    {profile.occupation}
                    {profile.location ? ` · ${profile.location}` : ''}
                  </p>
                )}
                {profile.bio && (
                  <p
                    className="text-sm text-[#3B0A0A]/80 overflow-hidden"
                    style={{
                      fontFamily: 'var(--font-body)',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {profile.bio}
                  </p>
                )}
                {profile.hobbies?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {profile.hobbies.slice(0, 4).map((h) => (
                      <span
                        key={h}
                        className="px-3 py-1 rounded-full bg-[#D4A017]/15 text-[#3B0A0A] text-xs"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {current && (
        <div className="flex gap-6 mt-8 z-10" style={{ animation: 'fadeInUp 0.4s ease-out both' }}>
          <button
            onClick={() => !exiting && triggerSwipe(current, 'pass')}
            disabled={!!exiting}
            className="w-16 h-16 rounded-full bg-[#FDF3E3] flex items-center justify-center text-2xl text-red-500 shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Pass"
          >
            ✕
          </button>
          <button
            onClick={() => !exiting && triggerSwipe(current, 'like')}
            disabled={!!exiting}
            className="w-16 h-16 rounded-full bg-[#F2A93B] flex items-center justify-center text-2xl text-[#3B0A0A] shadow-lg hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Like"
          >
            ♥
          </button>
        </div>
      )}
    </main>
  )
}
