import { useEffect, useRef } from "react";

function WhyHitMeUp() {
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

  const features = [
    {
      title: "Street-level map browsing",
      description:
        "See which shops on your street have active passes right now and filter by walking distance.",
    },
    {
      title: "Serial QR voucher passes",
      description:
        "Every claimed deal issues a unique HMU serial code and QR pass you can present at the counter.",
    },
    {
      title: "Context-aware suggestions",
      description:
        "Surface lunch, afternoon coffee, or retail markdowns matched to your saved categories and time of day.",
    },
    {
      title: "Pay online or at the counter",
      description:
        "Reserve free-to-claim counter passes or complete verified card checkout before you arrive.",
    },
    {
      title: "Fixed-window stock counts",
      description:
        "Merchants cap the exact number of passes per batch so offers stay honored when you walk in.",
    },
    {
      title: "Saved shops & verified reviews",
      description:
        "Bookmark neighborhood merchants and read feedback from shoppers who redeemed passes in person.",
    },
  ];

  return (
    <section
      id="about"
      className="border-b border-[#E6E0D6] bg-[#FDFBF7] py-20"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="grid gap-12 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          {/* Left — sticky heading */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[13px] font-medium text-[#7B7266]">
              Why HitMeUp
            </p>

            <h2 className="mt-2 text-[28px] sm:text-[32px] font-medium leading-[1.12] tracking-[-0.025em] text-[#1F1B16]">
              Built for how people{" "}
              <span className="serif font-normal text-[#D94832]">
                actually shop locally
              </span>
            </h2>

            <p className="mt-4 max-w-[38ch] text-[15px] leading-[1.65] text-[#5E554A]">
              Instead of cluttered coupon books or expired promo codes, HitMeUp
              issues live counter passes tied to real inventory at nearby stores.
            </p>
          </div>

          {/* Right — 1px hairline ledger grid */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#E6E0D6] bg-[#E6E0D6] sm:grid-cols-2">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="bg-[#FDFBF7] p-6 transition-colors duration-150 hover:bg-[#F7F4EE]"
              >
                <span className="font-mono text-[11px] text-[#7B7266] tabular-nums">
                  0{idx + 1}
                </span>
                <h3 className="mt-2 text-[16px] font-medium text-[#1F1B16]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-[#5E554A]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyHitMeUp;
