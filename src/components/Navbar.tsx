
"use client";

export default function Navbar() {
  return (
    <nav className="absolute bg-white top-0 left-0 z-50 w-full px-8 py-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Logo */}
        <a href="/" className="text-3xl text-blue-500 font-bold tracking-wider">
          synotion<span className="text-orange-400">.a</span>
        </a>

        {/* Navigation */}
        <div className="hidden items-center gap-10 md:flex">
          <a href="/" className="text-sm transition hover:text-cyan-500">
            Home
          </a>
          <a href="#about" className="text-sm transition hover:text-cyan-500">
            About
          </a>
          <a href="#members" className="text-sm transition hover:text-cyan-500">
            Members
          </a>
          <a href="#gallery" className="text-sm transition hover:text-cyan-500">
            Gallery
          </a>
        </div>

      </div>
    </nav>
  );
}
