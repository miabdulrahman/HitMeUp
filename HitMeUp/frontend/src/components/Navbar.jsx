import { Search, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";

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

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#login"
            className={`rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors duration-200 ${scrolled ? "text-[#1A1A1A] hover:bg-[#F0F0F0]" : "text-white hover:bg-white/10"}`}
          >
            Log in
          </a>

          <a
            href="#signup"
            className={`rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white transition-all duration-200 ${scrolled ? "bg-[#1A1A1A] hover:bg-[#333]" : "bg-white/15 backdrop-blur-sm hover:bg-white/25"}`}
          >
            Get started
          </a>
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

            <div className="mt-3 flex gap-3 border-t border-[#F0F0F0] pt-5">
              <a
                href="#login"
                className="flex-1 rounded-lg border border-[#E8E8E8] py-3 text-center text-[14px] font-semibold"
              >
                Log in
              </a>
              <a
                href="#signup"
                className="flex-1 rounded-lg bg-[#1A1A1A] py-3 text-center text-[14px] font-semibold text-white"
              >
                Get started
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;