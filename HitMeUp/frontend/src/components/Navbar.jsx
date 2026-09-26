import { Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
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
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">

        <a href="#home" className="flex items-center gap-0.5">
          <span className={`text-[22px] font-black tracking-[-0.04em] transition-colors duration-300 ${scrolled ? "text-[#1A1A1A]" : "text-white"}`}>
            HitMe<span className="text-[#E8503A]">Up</span>
          </span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-[14px] font-medium transition-colors duration-200 ${scrolled ? "text-[#4A4A4A] hover:text-[#1A1A1A]" : "text-white/70 hover:text-white"}`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden items-center gap-2 md:flex">

          <button
            className="rounded-xl p-3 text-[#172026] transition hover:bg-white/60 hover:text-[#ef5738]"
            aria-label="Search"
          >
            <Search size={19} />
          </button>

          <Link to="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#172026] transition hover:text-[#ef5738]"
          >
            Login
          </Link>

          <Link to="/register"
            className="rounded-xl bg-[#172026] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#ef5738]"
          >
            Sign Up
          </Link>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`rounded-lg p-2 lg:hidden transition-colors duration-300 ${scrolled ? "text-[#1A1A1A]" : "text-white"}`}
          aria-label="Toggle menu"
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
                className="text-[15px] font-medium text-[#1A1A1A]"
              >
                {link.name}
              </a>
            ))}

            <div className="mt-2 flex gap-3 border-t border-gray-100 pt-4">
              <Link to="/login"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-bold"
              >
                Login
              </Link>

              <Link to="/register"
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