import { ArrowRight, Ticket, Store } from "lucide-react";
import { Link } from "react-router-dom";

function CTA() {
  return (
    <section
      id="signup"
      className="border-b border-[#E6E0D6] bg-[#F7F4EE] py-20"
    >
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Shopper Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-8 sm:p-10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E6E0D6] bg-[#F7F4EE] px-3 py-1 text-xs font-medium text-[#5E554A]">
                <Ticket size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>For shoppers</span>
              </div>

              {/* Heading 5: text-2xl sm:text-3xl, Semibold (Rule B1) */}
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-[#1F1B16] [text-wrap:balance]">
                Claim a free counter pass
                <br />
                on your street corner
              </h2>

              {/* Body 3: text-base, Regular (Rule B1) */}
              <p className="mt-3 max-w-[46ch] text-sm sm:text-base font-normal leading-relaxed text-[#5E554A] [text-wrap:pretty]">
                Reserve limited window markdowns from local cafes, bakeries,
                salons, and retail shops. Pay nothing upfront to reserve a pass
                and scan your QR code at the register.
              </p>
            </div>

            {/* Nested radius: 16px outer - 8px gap = 8px (rounded-lg) */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#E6E0D6] pt-6">
              <Link
                to="/register"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#D94832] px-5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#C23B26] active:scale-[0.98]"
              >
                <span>Create shopper account</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
              <Link
                to="/deals"
                className="inline-flex h-11 items-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-4 text-sm font-medium text-[#1F1B16] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#EFE9DF] active:scale-[0.98]"
              >
                Browse live map
              </Link>
            </div>
          </div>

          {/* Merchant Card (Rule B4 flat dark theme background: #181818) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#272727] bg-[#181818] p-8 text-[#FDFBF7] sm:p-10 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#A89F91]">
                <Store size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>For merchants</span>
              </div>

              {/* Heading 5: text-2xl sm:text-3xl, Semibold (Rule B1) */}
              <h2 className="mt-4 text-2xl sm:text-3xl font-semibold leading-tight tracking-tight text-[#FDFBF7] [text-wrap:balance]">
                Publish timed batches and
                <br />
                verify at the register
              </h2>

              {/* Body 3: text-base, Regular (Rule B1) */}
              <p className="mt-3 max-w-[46ch] text-sm sm:text-base font-normal leading-relaxed text-[#A89F91] [text-wrap:pretty]">
                Pin your storefront on the discovery map, release capped voucher
                batches during quiet hours, and verify customer HMU serial codes
                from your merchant dashboard.
              </p>
            </div>

            {/* Nested radius: 16px outer - 8px gap = 8px (rounded-lg) */}
            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <Link
                to="/register"
                className="keep-light-surface keep-dark-ink inline-flex h-11 items-center gap-2 rounded-lg bg-[#FDFBF7] px-5 text-sm font-semibold text-[#1F1B16] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[#EFE9DF] active:scale-[0.98]"
              >
                <span>Register storefront</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-11 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-sm font-medium text-[#FDFBF7] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white/10 active:scale-[0.98]"
              >
                Merchant sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
