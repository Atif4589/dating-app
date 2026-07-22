"use client";

import { useEffect, useRef, useState } from "react";

type Profile = {
  id: number;
  name: string;
  age: number;
  bio: string;
  image: string;
};

type Props = {
  profiles: Profile[];
};

export default function SwipeCards({ profiles }: Props) {
  const [index, setIndex] = useState(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const startX = useRef(0);

  const current = profiles[index];

  const nextCard = () => {
    setTimeout(() => {
      setIndex((i) => i + 1);
      setX(0);
    }, 250);
  };

  const swipeRight = () => {
    setX(700);
    nextCard();
  };

  const swipeLeft = () => {
    setX(-700);
    nextCard();
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      setX(e.clientX - startX.current);
    };

    const up = () => {
      if (!dragging) return;

      setDragging(false);

      if (x > 120) {
        swipeRight();
      } else if (x < -120) {
        swipeLeft();
      } else {
        setX(0);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [dragging, x]);

  if (!current) {
    return (
      <div className="text-white text-3xl font-bold">
        🎉 No more profiles
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">

      <div
        onPointerDown={(e) => {
          startX.current = e.clientX - x;
          setDragging(true);
        }}
        className="relative w-[350px] h-[560px] rounded-3xl overflow-hidden shadow-2xl cursor-grab bg-zinc-900 select-none transition-transform duration-300"
        style={{
          transform: `translateX(${x}px) rotate(${x / 18}deg)`,
        }}
      >

        {/* LIKE */}

        <div
          className="absolute top-6 left-6 border-4 border-green-400 text-green-400 px-4 py-2 rounded-xl text-3xl font-black"
          style={{
            opacity: Math.max(0, x / 100),
          }}
        >
          LIKE
        </div>

        {/* NOPE */}

        <div
          className="absolute top-6 right-6 border-4 border-red-500 text-red-500 px-4 py-2 rounded-xl text-3xl font-black"
          style={{
            opacity: Math.max(0, -x / 100),
          }}
        >
          NOPE
        </div>

        <img
          src={current.image}
          alt={current.name}
          className="w-full h-[72%] object-cover pointer-events-none"
        />

        <div className="p-6 text-white">

          <h2 className="text-3xl font-bold">
            {current.name}, {current.age}
          </h2>

          <p className="text-gray-300 mt-3">
            {current.bio}
          </p>

        </div>

      </div>

      <div className="flex gap-10">

        <button
          onClick={swipeLeft}
          className="w-20 h-20 rounded-full bg-red-500 text-white text-4xl hover:scale-110 transition"
        >
          ✕
        </button>

        <button
          onClick={swipeRight}
          className="w-20 h-20 rounded-full bg-green-500 text-white text-4xl hover:scale-110 transition"
        >
          ❤
        </button>

      </div>
    </div>
  );
}
