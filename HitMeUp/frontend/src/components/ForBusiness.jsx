import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

function ForBusiness() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="for-business"
      className="bg-[#F7F5F2] py-24"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="grid items-center gap-16 lg:grid-cols-2">

          {/* Left — content */}
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
              For businesses
            </p>

            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1A1A1A]">
              Turn slow hours into
              <br />
              <span className="serif text-[#E8503A]">your best hours.</span>
            </h2>

            <p className="mt-5 max-w-[440px] text-[15px] leading-[1.7] text-[#6A6A6A]">
              Create flash deals to fill empty tables, move slow-selling products,
              and reach customers who are already nearby. Our AI helps you write
              compelling offers in seconds.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Create and manage flash deals with custom pricing",
                "AI generates deal titles, descriptions & marketing copy",
                "Smart targeting reaches the right customers nearby",
                "Monitor deal performance with real-time analytics",
                "Customers redeem with QR — no manual verification",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8503A]" />
                  <p className="text-[14px] leading-[1.6] text-[#4A4A4A]">{item}</p>
                </div>
              ))}
            </div>

            <a
              href="#signup"
              className="group mt-10 inline-flex items-center gap-2 rounded-lg bg-[#1A1A1A] px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[#E8503A]"
            >
              Register your business
              <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Right — AI demo card */}
          <div className="rounded-2xl border border-[#E8E8E8] bg-white p-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#E8503A]" />
              <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#8A8A8A]">
                AI Deal Creator — Live Preview
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {/* Input */}
              <div className="rounded-xl bg-[#FAFAFA] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A8A8A]">
                  Your input
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    ["Business", "ABC Restaurant"],
                    ["Product", "Chicken Burger"],
                    ["Price", "Rs. 1,200"],
                    ["Target", "Students"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-[13px] text-[#8A8A8A]">{label}</span>
                      <span className="text-[13px] font-semibold text-[#1A1A1A]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1A1A1A]">
                  <ArrowRight size={14} className="rotate-90 text-white" />
                </div>
              </div>

              {/* Output */}
              <div className="rounded-xl border border-[#E8503A]/20 bg-[#FEF8F6] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#E8503A]">
                  AI generates
                </p>
                <div className="mt-3">
                  <p className="text-[16px] font-bold text-[#1A1A1A]">
                    "Student Special: Crispy Chicken Burger"
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.6] text-[#6A6A6A]">
                    Enjoy a juicy chicken burger with fresh lettuce and secret sauce
                    at a student-only price.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="rounded bg-[#E8503A] px-2 py-0.5 text-[11px] font-bold text-white">
                      30% OFF
                    </span>
                    <span className="text-[12px] text-[#8A8A8A]">
                      Target: Students
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default ForBusiness;
