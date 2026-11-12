
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

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#15191f]">

      {/* Background Slideshow */}
      <div className="absolute inset-0">
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

        {/* Image Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Subtle Side Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/15 to-transparent" />

        {/* Bottom Transition */}
        <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-t from-[#101722] via-[#101722]/55 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-12 pt-24 md:px-12">

        <div className="max-w-4xl text-left">

          {/* Eyebrow */}
          <p
            className="animate-slide-up mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/90 md:text-sm"
            style={{ animationDelay: "300ms" }}
          >
            Welcome to SYNOTION
          </p>

          {/* Main Heading */}
          <h1
            className="animate-slide-up text-4xl font-bold leading-[1.15] tracking-tight text-white drop-shadow-mine md:text-6xl lg:text-7xl"
            style={{ animationDelay: "500ms" }}
          >
            Welcome to{" "}
            <span className="text-cyan-400">
              {typedText}
              <span className="ml-1 inline-block h-[0.8em] w-[2px] translate-y-1 animate-pulse bg-cyan-400" />
            </span>
          </h1>

          {/* Subtitle */}
          <h2
            className="animate-slide-up mt-6 text-lg font-medium tracking-wide text-white/85 drop-shadow-mine md:text-2xl"
            style={{ animationDelay: "800ms" }}
          >
            More than just a class.
          </h2>

          {/* Description */}
          <p
            className="animate-slide-up mt-4 max-w-lg text-sm leading-7 text-white/65 md:text-base"
            style={{ animationDelay: "1000ms" }}
          >
            A place to learn, grow, create, and make memories together.
          </p>

        </div>
      </div>

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-12 left-6 z-20 flex items-center gap-2 md:left-12">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={`h-1 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-9 bg-cyan-400"
                  : "w-4 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-10 right-6 z-20 text-xs font-medium tracking-widest text-white/60 md:right-12">
          <span className="text-white">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          {" / "}
          {String(images.length).padStart(2, "0")}
        </div>
      )}

    </section>
  );
}
