'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import imageCompression from 'browser-image-compression'

export default function Onboarding() {
  const { user } = useUser()
  const router = useRouter()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState('')
  const [interestedIn, setInterestedIn] = useState('')
  const [location, setLocation] = useState('')
  const [hobbies, setHobbies] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [occupation, setOccupation] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    setPhotoFile(file)
    if (file) {
      setPhotoPreview(URL.createObjectURL(file))
    } else {
      setPhotoPreview('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')

    let photoUrl = ''

    if (photoFile) {
      if (photoFile.size > 10 * 1024 * 1024) {
        setError('Photo is too large. Please choose one under 10MB.')
        setLoading(false)
        return
      }

      const compressedFile = await imageCompression(photoFile, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1080,
        useWebWorker: true,
      })

      const fileExt = photoFile.name.split('.').pop()
      const filePath = `${user.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile)

      if (uploadError) {
        setError(uploadError.message)
        setLoading(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      photoUrl = publicUrlData.publicUrl
    }

    const hobbiesArray = hobbies
      .split(',')
      .map((h) => h.trim())
      .filter((h) => h.length > 0)

    const { error: insertError } = await supabase.from('profiles').insert({
      clerk_user_id: user.id,
      name,
      age: parseInt(age),
      bio,
      gender,
      interested_in: interestedIn,
      location,
      hobbies: hobbiesArray,
      height_cm: heightCm ? parseInt(heightCm) : null,
      occupation,
      looking_for: lookingFor,
      photo_url: photoUrl,
    })

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    router.push('/')
  }

  const fieldClass =
    'w-full px-4 py-3 rounded-xl border border-[#D4A017]/30 bg-white/90 text-[#3B0A0A] placeholder-[#3B0A0A]/40 outline-none focus:border-[#D4A017] focus:ring-2 focus:ring-[#F2A93B]/30 transition-all'

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#3B0A0A] flex items-center justify-center px-6 py-16">
      <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F2A93B]/15 blur-3xl" style={{ animation: 'float 9s ease-in-out infinite' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-16 w-[26rem] h-[26rem] rounded-full bg-[#D4A017]/10 blur-3xl" style={{ animation: 'float 11s ease-in-out infinite 1s' }} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 bg-[#FDF3E3] rounded-3xl p-8 sm:p-10 w-full max-w-lg flex flex-col gap-5 shadow-2xl"
        style={{ animation: 'fadeInUp 0.6s ease-out both' }}
      >
        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}>
          <h1 className="text-3xl text-[#3B0A0A] mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Tell us about you
          </h1>
          <p className="text-sm text-[#3B0A0A]/60" style={{ fontFamily: 'var(--font-body)' }}>
            This is what people will see before they say yes.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.15s both' }}>
          <label
            htmlFor="photo"
            className="relative w-28 h-28 rounded-full border-2 border-dashed border-[#D4A017]/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#D4A017] transition-colors bg-white/60"
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-[#3B0A0A]/50 text-center px-2">Add photo</span>
            )}
          </label>
          <input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
          <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required className={fieldClass} />
          <input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required min="18" className={fieldClass} />
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.25s both' }}>
          <select value={gender} onChange={(e) => setGender(e.target.value)} required className={fieldClass}>
            <option value="">I am a...</option>
            <option value="man">Man</option>
            <option value="woman">Woman</option>
            <option value="other">Other</option>
          </select>
          <select value={interestedIn} onChange={(e) => setInterestedIn(e.target.value)} required className={fieldClass}>
            <option value="">Interested in...</option>
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="everyone">Everyone</option>
          </select>
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}>
          <input type="text" placeholder="Where do you live? (e.g. Pune, India)" value={location} onChange={(e) => setLocation(e.target.value)} required className={fieldClass} />
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}>
          <input type="text" placeholder="Hobbies (comma separated)" value={hobbies} onChange={(e) => setHobbies(e.target.value)} className={fieldClass} />
        </div>

        <div className="grid grid-cols-2 gap-3" style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}>
          <input type="number" placeholder="Height in cm" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className={fieldClass} />
          <input type="text" placeholder="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} className={fieldClass} />
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.45s both' }}>
          <select value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} className={fieldClass}>
            <option value="">Looking for...</option>
            <option value="serious">Something serious</option>
            <option value="casual">Something casual</option>
            <option value="unsure">Not sure yet</option>
          </select>
        </div>

        <div style={{ animation: 'fadeInUp 0.5s ease-out 0.5s both' }}>
          <textarea placeholder="A little about yourself" value={bio} onChange={(e) => setBio(e.target.value)} required rows={3} className={fieldClass} />
        </div>

        {error && (
          <p className="text-[#A32D2D] text-sm" style={{ animation: 'fadeInUp 0.3s ease-out both' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-3 rounded-full bg-[#F2A93B] text-[#3B0A0A] font-semibold hover:bg-[#D4A017] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.55s both' }}
        >
          {loading ? 'Saving...' : 'Create profile'}
        </button>
      </form>
    </main>
  )
}