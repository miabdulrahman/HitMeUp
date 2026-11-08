import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Footer() {
  const { isDark } = useTheme();
  return (
    <footer className="bg-[#FDFBF7] dark:bg-[#131209] text-[#1F1B16] dark:text-[#FDFBF7] border-t border-transparent dark:border-[#272727] transition-colors duration-300">
      <div className="mx-auto max-w-[1200px] px-6 pt-14 pb-24 lg:pb-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <a
              href="#home"
              className="inline-flex items-center py-0.5"
              aria-label="HitMeUp Home"
            >
              <img
                src={isDark ? "/logo-dark.png" : "/logo.png"}
                alt="HitMeUp"
                className="h-8 w-auto object-contain"
              />
            </a>

            <p className="mt-3.5 max-w-[280px] text-[13px] leading-[1.65] text-[#5E554A]">
              Location-based flash deal marketplace and QR voucher counter pass
              system. Built by Group E, Faculty of Technology, South Eastern
              University of Sri Lanka.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[12px] font-medium text-[#7B7266]">
              Explore
            </h4>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {[
                ["Nearby deals", "#deals"],
                ["Categories", "#categories"],
                ["How it works", "#how-it-works"],
                ["About", "#about"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className="text-[13px] text-[#5E554A] transition-colors duration-150 hover:text-[#1F1B16]"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Merchants */}
          <div>
            <h4 className="text-[12px] font-medium text-[#7B7266]">
              For merchants
            </h4>
            <div className="mt-3.5 flex flex-col gap-2.5">
              {[
                "Register store",
                "Publish flash deals",
                "POS voucher lookup",
                "Store analytics",
              ].map((link) => (
                <Link
                  key={link}
                  to="/register"
                  className="text-[13px] text-[#5E554A] transition-colors duration-150 hover:text-[#1F1B16]"
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-[12px] font-medium text-[#7B7266]">
              Account
            </h4>
            <div className="mt-3.5 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="text-[13px] text-[#5E554A] transition-colors duration-150 hover:text-[#1F1B16]"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="text-[13px] text-[#5E554A] transition-colors duration-150 hover:text-[#1F1B16]"
              >
                Create account
              </Link>
              <a
                href="#about"
                className="text-[13px] text-[#5E554A] transition-colors duration-150 hover:text-[#1F1B16]"
              >
                Terms &amp; privacy
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#E6E0D6] pt-6 text-[12px] text-[#7B7266] sm:flex-row">
          <p>© 2026 HitMeUp. All rights reserved.</p>
          <p>BICT · Group E · South Eastern University of Sri Lanka</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
