import { Search, Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isHomePage = location.pathname === "/";
  // Subpages always have solid navbar
  const isSolid = scrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Categories", href: "/categories", isRoute: true },
    { name: "How it works", href: isHomePage ? "#how-it-works" : "/#how-it-works", isRoute: false },
    { name: "Deals", href: isHomePage ? "#deals" : "/deals", isRoute: !isHomePage },
    { name: "For Business", href: isHomePage ? "#for-business" : "/#for-business", isRoute: false },
  ];

  const isSeller = user?.role === "seller" || user?.role === "business";
  const dashboardPath = isSeller ? "/seller/dashboard" : "/customer/dashboard";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
          isSolid
            ? "bg-white/95 shadow-[0_1px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl border-b border-gray-100"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-0.5">
            <span
              className={`text-[22px] font-black tracking-[-0.04em] transition-colors duration-300 ${
                isSolid ? "text-[#1A1A1A]" : "text-white"
              }`}
            >
              HitMe<span className="text-[#E8503A]">Up</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-[14px] font-medium transition-colors duration-200 ${
                    isSolid
                      ? "text-[#4A4A4A] hover:text-[#E8503A]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className={`text-[14px] font-medium transition-colors duration-200 ${
                    isSolid
                      ? "text-[#4A4A4A] hover:text-[#E8503A]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.name}
                </a>
              )
            )}
          </div>

          {/* Desktop Right */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Search Icon Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className={`flex items-center gap-2 rounded-xl p-2.5 transition cursor-pointer ${
                isSolid
                  ? "text-[#172026] hover:bg-black/5 hover:text-[#E8503A]"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
              aria-label="Search deals and categories"
              title="Search deals (Ctrl + K)"
            >
              <Search size={18} />
              <span className="text-xs font-semibold hidden xl:inline opacity-80">Search</span>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to={dashboardPath}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    isSolid
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
                  className={`rounded-xl p-2 transition cursor-pointer ${
                    isSolid
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
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                    isSolid
                      ? "text-[#172026] hover:text-[#E8503A]"
                      : "text-white hover:text-[#FF8C73]"
                  }`}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="rounded-xl bg-[#172026] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#E8503A]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className={`rounded-lg p-2 transition cursor-pointer ${
                isSolid ? "text-[#1A1A1A]" : "text-white"
              }`}
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`rounded-lg p-2 transition-colors duration-300 cursor-pointer ${
                isSolid ? "text-[#1A1A1A]" : "text-white"
              }`}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile Slide-down Menu */}
        {menuOpen && (
          <div className="border-t border-[#F0F0F0] bg-white px-6 py-6 lg:hidden shadow-xl">
            <div className="flex flex-col gap-4">
              {/* Mobile Search Button */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-500"
              >
                <Search size={18} className="text-[#E8503A]" />
                <span>Search deals & categories...</span>
              </button>

              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-[15px] font-semibold text-[#1A1A1A] hover:text-[#E8503A]"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-[15px] font-semibold text-[#1A1A1A] hover:text-[#E8503A]"
                  >
                    {link.name}
                  </a>
                )
              )}

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
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center font-bold text-gray-800"
                    >
                      Login
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-xl bg-[#E8503A] px-4 py-3 text-center font-bold text-white shadow-md"
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

      {/* Global Interactive Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}

export default Navbar;