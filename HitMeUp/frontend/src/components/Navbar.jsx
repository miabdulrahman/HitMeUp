import { Search, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
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

  const dashboardPath = user?.role === "seller" ? "/seller/dashboard" : "/customer/dashboard";

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-0.5">
          <span
            className={`text-[22px] font-black tracking-[-0.04em] transition-colors duration-300 ${scrolled ? "text-[#1A1A1A]" : "text-white"
              }`}
          >
            HitMe<span className="text-[#E8503A]">Up</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-[14px] font-medium transition-colors duration-200 ${scrolled
                ? "text-[#4A4A4A] hover:text-[#1A1A1A]"
                : "text-white/70 hover:text-white"
                }`}
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Right */}
        <div className="hidden items-center gap-2 md:flex">
          <button
            className={`rounded-xl p-2.5 transition ${scrolled
              ? "text-[#172026] hover:bg-black/5 hover:text-[#ef5738]"
              : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2.5">
              <Link
                to={dashboardPath}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${scrolled
                  ? "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  : "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  }`}
              >
                <LayoutDashboard size={15} />
                <span>{user.name?.split(" ")[0] || "User"}</span>
                <span className="rounded bg-[#FF4A2F] px-1.5 py-0.5 text-[10px] text-white uppercase">
                  {user.role}
                </span>
              </Link>

              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className={`rounded-xl p-2 transition ${scrolled
                  ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
                  : "text-white/70 hover:bg-white/10 hover:text-red-400"
                  }`}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${scrolled
                  ? "text-[#172026] hover:text-[#ef5738]"
                  : "text-white hover:text-[#FF4A2F]"
                  }`}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-xl bg-[#172026] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#ef5738]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`rounded-lg p-2 lg:hidden transition-colors duration-300 ${
            scrolled ? "text-[#1A1A1A]" : "text-white"
          }`}
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

            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-4">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={dashboardPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-center font-bold text-gray-900"
                  >
                    <User size={16} />
                    {user.name} ({user.role})
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMenuOpen(false);
                      navigate("/");
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-center font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-bold"
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex-1 rounded-xl bg-[#FF4A2F] px-4 py-3 text-center font-bold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;