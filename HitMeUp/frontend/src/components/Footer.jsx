function Footer() {
  return (
    <footer className="border-t border-[#F0F0F0] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14">

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <a href="#home" className="text-[20px] font-black tracking-[-0.03em] text-[#1A1A1A]">
              HitMe<span className="text-[#E8503A]">Up</span>
            </a>

            <p className="mt-4 max-w-[260px] text-[14px] leading-[1.7] text-[#8A8A8A]">
              Real-time location-based flash deal marketplace with AI.
              Built by Group E, Faculty of Technology, Southeastern University of Sri Lanka.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#8A8A8A]">
              Explore
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              {["Flash Deals", "Categories", "How It Works", "About"].map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                  className="text-[14px] text-[#4A4A4A] transition-colors duration-200 hover:text-[#1A1A1A]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Business */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#8A8A8A]">
              For Business
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              {["Register", "Create Deals", "AI Deal Creator", "Analytics"].map((link) => (
                <a
                  key={link}
                  href="#for-business"
                  className="text-[14px] text-[#4A4A4A] transition-colors duration-200 hover:text-[#1A1A1A]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[#8A8A8A]">
              Legal
            </h4>
            <div className="mt-4 flex flex-col gap-3">
              {["Privacy Policy", "Terms of Service", "Contact"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-[14px] text-[#4A4A4A] transition-colors duration-200 hover:text-[#1A1A1A]"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>

        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#F0F0F0] pt-6 text-[13px] text-[#CACACA] sm:flex-row">
          <p>© 2026 HitMeUp. All rights reserved.</p>
          <p>BICT · Group E · Southeastern University of Sri Lanka</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;