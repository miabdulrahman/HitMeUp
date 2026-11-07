import { Search, Menu, X, User, LogOut, LayoutDashboard, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import SearchModal from "./SearchModal";
import DealDetailModal from "./DealDetailModal";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
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
  const dashboardPath = isSeller ? "/seller/dashboard" : "/customer/dashboard";

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-40 transition-all duration-200 ${
          scrolled
            ? "border-b border-[#E6E0D6] bg-[#FDFBF7]/95 shadow-[0_2px_12px_rgba(31,27,22,0.05)] backdrop-blur-md"
            : "border-b border-[#E6E0D6]/80 bg-[#F7F4EE]/90 backdrop-blur-sm"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#1F1B16] font-mono text-[13px] font-medium text-[#FDFBF7] transition-colors duration-150 group-hover:bg-[#D94832]">
                H
              </span>
              <span className="text-[18px] font-semibold tracking-[-0.03em] text-[#1F1B16]">
                HitMeUp
              </span>
            </Link>

            <div className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => {
                const isActive = isHomePage && activeHash === link.hash;
                const baseClass = `relative rounded-lg px-3 py-1.5 text-[14px] transition-colors duration-150 ${
                  isActive
                    ? "bg-[#EFE9DF] font-medium text-[#1F1B16]"
                    : "font-normal text-[#5E554A] hover:bg-[#EFE9DF]/60 hover:text-[#1F1B16]"
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
          <div className="hidden items-center gap-2.5 md:flex">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2.5 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3 text-[13px] text-[#5E554A] transition-colors duration-150 hover:border-[#1F1B16]/30 hover:text-[#1F1B16] cursor-pointer"
              aria-label="Search deals and categories"
              title="Search deals (Ctrl + K)"
            >
              <Search size={14} strokeWidth={1.5} className="text-[#7B7266]" />
              <span className="hidden xl:inline">Search deals, shops...</span>
              <kbd className="hidden rounded-[5px] border border-[#E6E0D6] bg-[#EFE9DF]/70 px-1.5 py-0.5 font-mono text-[11px] text-[#7B7266] xl:inline">
                Ctrl K
              </kbd>
            </button>

            {/* Direct Full Map View Button */}
            <Link
              to="/deals?view=map"
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF] lg:inline-flex"
              title="Open full interactive map view"
            >
              <MapPin size={14} strokeWidth={1.5} className="text-[#D94832]" />
              <span>Map view</span>
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={dashboardPath}
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-3 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF]"
                >
                  <LayoutDashboard size={15} strokeWidth={1.5} className="text-[#5E554A]" />
                  <span>{user.name?.split(" ")[0] || "Account"}</span>
                  <span className="rounded-[5px] bg-[#EFE9DF] px-1.5 py-0.5 text-[11px] font-normal text-[#5E554A] capitalize">
                    {user.role}
                  </span>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7B7266] transition-colors duration-150 hover:bg-[#EFE9DF] hover:text-[#B91C1C] cursor-pointer"
                  title="Log out"
                >
                  <LogOut size={16} strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#5E554A] transition-colors duration-150 hover:bg-[#EFE9DF]/60 hover:text-[#1F1B16]"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="flex h-9 items-center rounded-lg bg-[#1F1B16] px-4 text-[13px] font-medium text-[#FDFBF7] transition-colors duration-150 hover:bg-[#D94832]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F1B16] transition-colors hover:bg-[#EFE9DF] cursor-pointer"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1F1B16] transition-colors hover:bg-[#EFE9DF] cursor-pointer"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
            </button>
          </div>
        </nav>

        {/* Mobile Slide-down Menu */}
        {menuOpen && (
          <div className="border-t border-[#E6E0D6] bg-[#FDFBF7] px-6 py-5 lg:hidden">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2.5 rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-3.5 py-2.5 text-left text-[13px] text-[#5E554A]"
              >
                <Search size={16} strokeWidth={1.5} className="text-[#7B7266]" />
                <span>Search deals and categories</span>
              </button>

              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-1 text-[15px] font-medium text-[#1F1B16] hover:text-[#D94832]"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-1 text-[15px] font-medium text-[#1F1B16] hover:text-[#D94832]"
                  >
                    {link.name}
                  </a>
                )
              )}

              <Link
                to="/deals?view=map"
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 py-1 text-[15px] font-medium text-[#D94832]"
              >
                <MapPin size={15} strokeWidth={1.5} />
                <span>Explore full street map</span>
              </Link>

              <div className="mt-2 flex flex-col gap-2 border-t border-[#E6E0D6] pt-4">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      to={dashboardPath}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EFE9DF] px-4 py-2.5 text-[14px] font-medium text-[#1F1B16]"
                    >
                      <User size={16} strokeWidth={1.5} />
                      <span>{user.name} ({user.role})</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg border border-[#E6E0D6] px-4 py-2.5 text-[14px] font-medium text-[#B91C1C]"
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
                      className="flex-1 rounded-lg border border-[#E6E0D6] bg-[#FDFBF7] px-4 py-2.5 text-center text-[14px] font-medium text-[#1F1B16]"
                    >
                      Log in
                    </Link>

                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 rounded-lg bg-[#D94832] px-4 py-2.5 text-center text-[14px] font-medium text-white"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
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
