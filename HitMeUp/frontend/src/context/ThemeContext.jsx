import { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useLocation } from "react-router-dom";

const ThemeContext = createContext({
  theme: "light",
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("hitmeup_theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("hitmeup_theme", theme);
  }, [theme, isDark]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Floating theme toggle for standalone pages without the main Navbar
 * (Auth, Customer/Seller Dashboards, HitMeUp Pay, Admin Portal)
 */
export function FloatingThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // Pages that already render the main Navbar have the toggle in the header
  const navbarRoutes = ["/", "/deals", "/categories", "/map", "/search"];
  const hasNavbar =
    navbarRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/category/");

  if (hasNavbar) return null;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed bottom-5 right-5 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#1F1F1F] text-[#1F1B16] dark:text-[#FDFBF7] shadow-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 active:scale-95 cursor-pointer"
    >
      {isDark ? (
        <Sun size={17} strokeWidth={1.75} className="text-[#FF8A6B]" />
      ) : (
        <Moon size={17} strokeWidth={1.75} className="text-[#5E554A]" />
      )}
    </button>
  );
}

