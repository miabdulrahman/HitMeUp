import { Menu, Search, X } from "lucide-react";
import { useState } from "react";


export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header sticky top-0 z-50 border-b bg-white">
      <div className="navbar-shell">
        <div className="navbar-topline">
          <a href="#" className="brand" aria-label="HitMeUp home">
            HitMeUp
          </a>

          <nav id="main-navigation" className={`main-nav ${isMenuOpen ? "is-open" : ""}`}>
            <a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a>
            <a href="#deals" onClick={() => setIsMenuOpen(false)}>Deals</a>
            <a href="#categories" onClick={() => setIsMenuOpen(false)}>Categories</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it works</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)}>About</a>
          </nav>

          <div className="navbar-actions">
            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input type="search" placeholder="Search" aria-label="Search deals" />
            </label>
            <button type="button" className="signup-btn">Sign up</button>
            <button
              type="button"
              className="menu-toggle"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="main-navigation"
              onClick={() => setIsMenuOpen((menuOpen) => !menuOpen)}
            >
              {isMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>

        <div className="mobile-search">
          <label className="search-box">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Search deals" aria-label="Search deals" />
          </label>
        </div>
      </div>
    </header>
  );
}