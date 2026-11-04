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
          <div className="flex flex-col justify-between rounded-2xl border border-[#E6E0D6] bg-[#FDFBF7] p-8 sm:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-[#E6E0D6] bg-[#F7F4EE] px-2.5 py-1 text-[12px] font-medium text-[#5E554A]">
                <Ticket size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>For shoppers</span>
              </div>

              <h2 className="mt-4 text-[26px] sm:text-[28px] font-medium leading-[1.15] tracking-[-0.025em] text-[#1F1B16]">
                Claim a free counter pass{" "}
                <span className="serif font-normal text-[#D94832]">
                  on your street
                </span>
              </h2>

              <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-[#5E554A]">
                Reserve short-window markdowns from local cafes, bakeries,
                salons, and retail shops. Pay nothing upfront to claim a pass
                and scan your QR code at the register.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#E6E0D6] pt-6">
              <Link
                to="/register"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#D94832] px-5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#C23B26]"
              >
                <span>Create shopper account</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
              <Link
                to="/deals"
                className="inline-flex h-10 items-center rounded-lg border border-[#E6E0D6] bg-[#F7F4EE] px-4 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF]"
              >
                Browse live map
              </Link>
            </div>
          </div>

          {/* Merchant Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#1F1B16] bg-[#1F1B16] p-8 text-[#FDFBF7] sm:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[12px] font-medium text-[#A89F91]">
                <Store size={14} strokeWidth={1.5} className="text-[#D94832]" />
                <span>For merchants</span>
              </div>

              <h2 className="mt-4 text-[26px] sm:text-[28px] font-medium leading-[1.15] tracking-[-0.025em] text-[#FDFBF7]">
                Publish timed batches &amp;{" "}
                <span className="serif font-normal text-[#D94832]">
                  verify at the register
                </span>
              </h2>

              <p className="mt-3 max-w-[46ch] text-[15px] leading-[1.6] text-[#A89F91]">
                Pin your storefront on the discovery map, release capped voucher
                batches during quiet hours, and verify customer HMU serial codes
                from your merchant dashboard.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-white/10 pt-6">
              <Link
                to="/register"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#FDFBF7] px-5 text-[13px] font-medium text-[#1F1B16] transition-colors duration-150 hover:bg-[#EFE9DF]"
              >
                <span>Register storefront</span>
                <ArrowRight size={15} strokeWidth={1.5} />
              </Link>
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-lg border border-white/15 bg-white/5 px-4 text-[13px] font-medium text-[#FDFBF7] transition-colors duration-150 hover:bg-white/10"
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
