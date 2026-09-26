import { ArrowRight } from "lucide-react";

function CTA() {
  return (
    <section id="signup" className="bg-[#1A1A1A] py-24">
      <div className="mx-auto max-w-[1200px] px-6">

        <div className="mx-auto max-w-[620px] text-center">
          <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold leading-[1.15] tracking-[-0.03em] text-white">
            Start finding deals
            <br />
            <span className="serif text-[#E8503A]">in your neighbourhood.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-[460px] text-[15px] leading-[1.7] text-[#6A6A6A]">
            Whether you're hunting for savings or filling your store,
            HitMeUp brings the right people together at the right time.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#signup"
              className="group flex items-center gap-2 rounded-lg bg-[#E8503A] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#D4402C]"
            >
              Get started free
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>

            <a
              href="#for-business"
              className="rounded-lg border border-white/15 px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:border-white/30 hover:bg-white/5"
            >
              I'm a business owner
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}

export default CTA;