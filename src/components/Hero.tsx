
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const typingWords = [
  "Our Class!",
  "The Best Class of 2029!",
  "The Black Parade.",
  "Mobile Legend.",
];

export default function Hero() {
  // Slideshow State
  const [images, setImages] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto Type State
  const [typedText, setTypedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch photos from Supabase
  useEffect(() => {
    let cancelled = false;

    async function fetchImages() {
      const { data, error } = await supabase
        .from("hero_photos")
        .select("storage_path")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Gagal mengambil foto Hero:", error);
        return;
      }

      if (!cancelled && data) {
        const photoUrls = data.map((photo) => {
          const { data: publicData } = supabase.storage
            .from("hero-gallery")
            .getPublicUrl(photo.storage_path);

          return publicData.publicUrl;
        });

        setImages(photoUrls);
        setActiveIndex(0);
      }
    }

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto Type Effect
  useEffect(() => {
    const currentWord = typingWords[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && typedText === currentWord) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && typedText === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % typingWords.length);
    } else {
      timeout = setTimeout(() => {
        setTypedText(
          isDeleting
            ? currentWord.slice(0, typedText.length - 1)
            : currentWord.slice(0, typedText.length + 1)
        );
      }, isDeleting ? 40 : 100);
    }

    return () => clearTimeout(timeout);
  }, [typedText, isDeleting, wordIndex]);

  // Slideshow Effect
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const hasImages = images.length > 0;

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">

      {/* Background */}
      <div className="absolute inset-0 bg-[#242424] brightness-75">
        {images.map((image, index) => (
          <div
            key={image}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{
              backgroundImage: `url("${image}")`,
              opacity: activeIndex === index ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 z-[5] h-48 w-full bg-gradient-to-t from-[#101722] via-[#101722]/70 to-transparent" />

      {/* Main Content */}
      <div className="relative z-10 px-6 text-center text-white">

        {/* First Heading */}
        <h1
          className="animate-slide-up text-4xl font-bold tracking-tight drop-shadow-mine md:text-6xl"
          style={{ animationDelay: "500ms" }}
        >
          Welcome to{" "}
          <span className="text-cyan-400">
            {typedText}
          </span>
          <span className="ml-1 inline-block animate-pulse text-blue-400">
            |
          </span>
        </h1>

        {/* Second Heading */}
        <h2
          className="animate-slide-up text-xl font-semibold tracking-wide drop-shadow-mine md:text-3xl"
          style={{ animationDelay: "1200ms" }}
        >
          Gudangnya para manusia{" "}
          <span className="text-orange-400">
            berkelas.
          </span>
        </h2>

      </div>

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-10 z-20 flex gap-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeIndex === index
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
