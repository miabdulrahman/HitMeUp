import {
  Search,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Deals", href: "#deals" },
    { name: "Categories", href: "#categories" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "About", href: "#about" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#dcd8ca] bg-[#f5f2ea]/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">

        {/* Logo */}
        <a
          href="#home"
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#172026] text-lg font-black text-[#f5f2ea] shadow-sm">
            H
          </div>

          <span className="text-2xl font-black tracking-tight text-[#172026]">
            Hit<span className="text-[#ef5738]">Me</span>Up
          </span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-[#172026] transition hover:text-[#ef5738]"
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="rounded-lg p-2 text-[#141922] md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-5 py-5 md:hidden">
          <div className="flex flex-col gap-4">

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-semibold text-[#141922] hover:text-[#FF4A2F]"
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