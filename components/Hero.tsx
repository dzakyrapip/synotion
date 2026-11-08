
"use client";

import { useEffect, useState } from "react";

const images = [
  // Nanti diganti dengan foto dari Supabase
];

export default function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hasImages = images.length > 0;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">

      {/* Background */}
      {hasImages && images.map((image, index) => (
        <div
          key={image}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            activeIndex === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${image})` }}
        />
      ))}

      {/* Overlay */}
      {hasImages && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Content */}
      <div className={`relative z-10 px-6 text-center ${
        hasImages ? "text-white" : "text-black"
      }`}>
        <p className="mb-4 text-sm tracking-[0.5em] uppercase">
          Welcome to
        </p>

        <h1 className="text-5xl font-bold tracking-tight md:text-8xl">
          OUR CLASS
        </h1>

        <p className="mt-5 text-sm tracking-widest md:text-base">
          Together We Create Memories
        </p>
      </div>

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-10 z-20 flex gap-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                activeIndex === index
                  ? "w-10 bg-white"
                  : "w-4 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

    </section>
  );
}
