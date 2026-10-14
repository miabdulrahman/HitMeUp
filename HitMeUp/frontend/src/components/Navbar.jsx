import { ArrowRight, Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

import { Link } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "How it works", href: "#how-it-works" },
    { name: "Deals", href: "#deals" },
    { name: "For Business", href: "#for-business" },
    { name: "About", href: "#about" },
  ];

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3.5 sm:px-6">

        <a href="#home" className="group flex items-center gap-2" aria-label="HitMeUp home">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#E8503A] text-sm font-black text-white shadow-sm transition-transform duration-200 group-hover:rotate-[-6deg]">
            H
          </span>
          <span className={`text-[21px] font-black tracking-[-0.05em] transition-colors duration-300 ${scrolled ? "text-[#1A1A1A]" : "text-white"}`}>
            HitMe<span className="text-[#E8503A]">Up</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/10 p-1 backdrop-blur-md lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors duration-200 ${scrolled ? "text-[#4A4A4A] hover:bg-[#F7F5F2] hover:text-[#1A1A1A]" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden items-center gap-1 md:flex">

          <a
            href="#deals"
            className={`rounded-xl p-3 transition ${scrolled ? "text-[#172026] hover:bg-[#F7F5F2] hover:text-[#ef5738]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
            aria-label="Browse deals"
          >
            <Search size={19} />
          </a>

          <Link to="/login"
            onClick={() => setMenuOpen(false)}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${scrolled ? "text-[#172026] hover:text-[#ef5738]" : "text-white hover:text-white/70"}`}
          >
            Login
          </Link>

          <Link to="/register"
            onClick={() => setMenuOpen(false)}
            className="group flex items-center gap-2 rounded-xl bg-[#E8503A] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#E8503A]/20 transition hover:bg-[#D4402C]"
          >
            Get started
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`rounded-lg p-2 lg:hidden transition-colors duration-300 ${scrolled ? "text-[#1A1A1A]" : "text-white"}`}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {menuOpen && (
        <div className="border-t border-[#F0F0F0] bg-white px-6 py-6 lg:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2 text-[15px] font-medium text-[#1A1A1A] transition hover:bg-[#F7F5F2]"
              >
                {link.name}
              </a>
            ))}

            <div className="mt-2 flex gap-3 border-t border-gray-100 pt-4">
              <Link to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-bold"
              >
                Login
              </Link>

              <Link to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 rounded-xl bg-[#FF4A2F] px-4 py-3 text-center font-bold text-white"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;