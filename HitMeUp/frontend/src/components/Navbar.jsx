import { Search, Menu, X, User, LogOut, LayoutDashboard, MapPin, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useTheme } from "../context/ThemeContext";
import SearchModal from "./SearchModal";
import DealDetailModal from "./DealDetailModal";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHomePage) return;
    const sectionIds = ["deals", "categories", "about", "for-business", "how-it-works"];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: 0.05 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHomePage]);

  const navLinks = [
    { name: "Nearby deals", href: isHomePage ? "#deals" : "/deals", hash: "#deals", isRoute: !isHomePage },
    { name: "Categories", href: isHomePage ? "#categories" : "/categories", hash: "#categories", isRoute: !isHomePage },
    { name: "How it works", href: isHomePage ? "#how-it-works" : "/#how-it-works", hash: "#how-it-works", isRoute: false },
    { name: "For merchants", href: isHomePage ? "#for-business" : "/#for-business", hash: "#for-business", isRoute: false },
  ];

  const isSeller = user?.role === "seller" || user?.role === "business";
  const dashboardPath =
    user?.role === "admin"
      ? "/admin"
      : isSeller
        ? "/seller/dashboard"
        : "/customer/dashboard";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${scrolled
          ? "border-b border-[#E6E0D6] dark:border-[#272727] bg-[#FDFBF7]/95 dark:bg-[#181818]/95 shadow-[0_2px_12px_rgba(31,27,22,0.05)] backdrop-blur-md"
          : "border-b border-[#E6E0D6]/80 dark:border-[#272727]/80 bg-[#F7F4EE]/90 dark:bg-[#131209]/90 backdrop-blur-sm"
          }`}
      >
        <nav className="mx-auto flex h-14 lg:h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5 xl:gap-7 min-w-0">
            <Link
              to="/"
              className="flex shrink-0 items-center group py-0.5"
              aria-label="HitMeUp Home"
            >
              <img
                src="/logo.png"
                alt="HitMeUp"
                className="h-6.5 lg:h-8 w-auto object-contain transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]"
              />
            </Link>

            <div className="hidden items-center gap-0.5 xl:gap-1 lg:flex">
              {navLinks.map((link) => {
                const isActive = isHomePage && activeHash === link.hash;
                const baseClass = `relative whitespace-nowrap shrink-0 rounded-lg px-2.5 xl:px-3 py-1.5 text-[13px] xl:text-sm transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isActive
                  ? "bg-[#EFE9DF] dark:bg-[#272727] font-medium text-[#1F1B16] dark:text-[#FDFBF7]"
                  : "font-normal text-[#5E554A] dark:text-[#CFC6B8] hover:bg-[#EFE9DF]/60 dark:hover:bg-[#272727]/70 hover:text-[#1F1B16] dark:hover:text-[#FDFBF7]"
                  }`;

                return link.isRoute ? (
                  <Link key={link.name} to={link.href} className={baseClass}>
                    {link.name}
                  </Link>
                ) : (
                  <a key={link.name} href={link.href} className={baseClass}>
                    {link.name}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Desktop Right */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] px-3 text-[13px] text-[#5E554A] dark:text-[#CFC6B8] transition-colors duration-150 hover:border-[#1F1B16]/30 dark:hover:border-white/30 hover:text-[#1F1B16] dark:hover:text-[#FDFBF7] cursor-pointer"
              aria-label="Search deals and categories"
              title="Search deals (Ctrl + K)"
            >
              <Search size={14} strokeWidth={1.5} className="shrink-0 text-[#7B7266] dark:text-[#8E867B]" />
              <span className="hidden xl:inline whitespace-nowrap">Search deals...</span>
              <kbd className="hidden whitespace-nowrap rounded-[5px] border border-[#E6E0D6] dark:border-[#313131] bg-[#EFE9DF]/70 dark:bg-[#272727] px-1.5 py-0.5 font-mono text-[11px] text-[#7B7266] dark:text-[#A89F91] xl:inline-block">
                Ctrl K
              </kbd>
            </button>

            {/* Direct Full Map View Button */}
            <Link
              to="/deals?view=map"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] px-3 text-xs font-semibold text-[#1F1B16] dark:text-[#FDFBF7] transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#EFE9DF] dark:hover:bg-[#272727]"
              title="Open full interactive map view"
            >
              <MapPin size={14} strokeWidth={1.5} className="shrink-0 text-[#D94832]" />
              <span className="whitespace-nowrap">Map view</span>
            </Link>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] text-[#5E554A] dark:text-[#CFC6B8] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#EFE9DF] dark:hover:bg-[#272727] hover:text-[#1F1B16] dark:hover:text-[#FDFBF7] active:scale-[0.98] cursor-pointer"
            >
              {isDark ? (
                <Sun size={15} strokeWidth={1.75} className="text-[#FF8A6B]" />
              ) : (
                <Moon size={15} strokeWidth={1.75} />
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="flex shrink-0 items-center gap-1.5">
                <Link
                  to={dashboardPath}
                  className="flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] px-3 text-[13px] font-medium text-[#1F1B16] dark:text-[#FDFBF7] transition-colors duration-150 hover:bg-[#EFE9DF] dark:hover:bg-[#272727]"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "User"}
                      className="h-5 w-5 shrink-0 rounded-full object-cover border"
                    />
                  ) : (
                    <LayoutDashboard size={15} strokeWidth={1.5} className="shrink-0 text-[#5E554A] dark:text-[#CFC6B8]" />
                  )}
                  <span className="whitespace-nowrap">{user.name?.split(" ")[0] || "Account"}</span>
                  <span className="whitespace-nowrap rounded-[5px] bg-[#EFE9DF] dark:bg-[#272727] px-1.5 py-0.5 text-[11px] font-normal text-[#5E554A] dark:text-[#CFC6B8] capitalize">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#7B7266] dark:text-[#8E867B] transition-colors duration-150 hover:bg-[#EFE9DF] dark:hover:bg-[#272727] hover:text-[#B91C1C] dark:hover:text-[#F87171] cursor-pointer"
                  title="Log out"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  to="/login"
                  className="whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#5E554A] dark:text-[#CFC6B8] transition-colors duration-150 hover:bg-[#EFE9DF]/60 dark:hover:bg-[#272727] hover:text-[#1F1B16] dark:hover:text-[#FDFBF7]"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg bg-[#1F1B16] px-4 text-[13px] font-medium text-[#FDFBF7] transition-colors duration-150 hover:bg-[#D94832]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1F1B16] dark:text-[#FDFBF7] transition-colors hover:bg-[#EFE9DF] dark:hover:bg-[#272727] cursor-pointer"
            >
              {isDark ? (
                <Sun size={16} strokeWidth={1.75} className="text-[#FF8A6B]" />
              ) : (
                <Moon size={16} strokeWidth={1.75} />
              )}
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#1F1B16] dark:text-[#FDFBF7] transition-colors hover:bg-[#EFE9DF] dark:hover:bg-[#272727] cursor-pointer"
              aria-label="Search"
            >
              <Search size={16} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#1F1B16] dark:text-[#FDFBF7] transition-colors hover:bg-[#EFE9DF] dark:hover:bg-[#272727] cursor-pointer"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              <span
                className={`absolute transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                  }`}
              >
                <Menu size={18} strokeWidth={1.5} />
              </span>
              <span
                className={`absolute transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                  }`}
              >
                <X size={18} strokeWidth={1.5} />
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile Slide-down Menu with smooth CSS grid height and fade animation */}
        <div
          aria-hidden={!menuOpen}
          className={`grid lg:hidden transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] bg-[#FDFBF7] dark:bg-[#181818] ${menuOpen
            ? "grid-rows-[1fr] opacity-100 border-t border-[#E6E0D6] dark:border-[#272727] shadow-[0_16px_32px_rgba(0,0,0,0.12)]"
            : "grid-rows-[0fr] opacity-0 pointer-events-none border-t-0"
            }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`flex flex-col gap-3 px-6 py-5 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${menuOpen ? "translate-y-0" : "-translate-y-2"
                }`}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2.5 rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#1F1F1F] px-3.5 py-2.5 text-left text-[13px] text-[#5E554A] dark:text-[#CFC6B8]"
              >
                <Search size={16} strokeWidth={1.5} className="text-[#7B7266] dark:text-[#8E867B]" />
                <span>Search deals and categories</span>
              </button>

              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-1 text-[15px] font-medium text-[#1F1B16] dark:text-[#FDFBF7] hover:text-[#D94832] dark:hover:text-[#FF7A59]"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-1 text-[15px] font-medium text-[#1F1B16] dark:text-[#FDFBF7] hover:text-[#D94832] dark:hover:text-[#FF7A59]"
                  >
                    {link.name}
                  </a>
                )
              )}

              <Link
                to="/deals?view=map"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 py-1 text-[15px] font-medium text-[#D94832] dark:text-[#FF7A59]"
              >
                <MapPin size={15} strokeWidth={1.5} />
                <span>Explore full street map</span>
              </Link>

              <div className="mt-2 flex flex-col gap-2 border-t border-[#E6E0D6] dark:border-[#313131] pt-4">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      to={dashboardPath}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EFE9DF] dark:bg-[#272727] px-4 py-2.5 text-[14px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || "User"}
                          className="h-6 w-6 rounded-full object-cover border border-[#E6E0D6] dark:border-[#313131]"
                        />
                      ) : (
                        <User size={16} strokeWidth={1.5} />
                      )}
                      <span>{user.name} ({user.role})</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg border border-[#E6E0D6] dark:border-[#313131] px-4 py-2.5 text-[14px] font-medium text-[#B91C1C] dark:text-[#F87171]"
                    >
                      <LogOut size={16} strokeWidth={1.5} />
                      <span>Log out</span>
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2.5">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] px-4 py-2.5 text-center text-[14px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]"
                    >
                      Log in
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-lg bg-[#D94832] px-4 py-2.5 text-center text-[14px] font-medium text-white hover:bg-[#C23B26]"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectDeal={(deal) => setSelectedDeal(deal)}
      />

      <DealDetailModal
        deal={selectedDeal}
        isOpen={!!selectedDeal}
        onClose={() => setSelectedDeal(null)}
      />
    </>
  );
}

export default Navbar;
