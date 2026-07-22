"use client";

import SwipeCards from "./Swipecards";

export default function DiscoverPage() {
  const demoProfiles = [
    {
      id: 1,
      name: "Emma",
      age: 22,
      bio: "Coffee addict ☕ • Loves travelling ✈️",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=900",
    },
    {
      id: 2,
      name: "Sophia",
      age: 24,
      bio: "Gym 💪 | Dogs 🐶 | Music 🎵",
      image:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=900",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-8">

      <SwipeCards profiles={demoProfiles} />

    </main>
  );
}
