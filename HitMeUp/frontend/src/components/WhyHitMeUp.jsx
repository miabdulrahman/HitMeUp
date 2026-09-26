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
      title: "Location-first discovery",
      description: "Find deals within walking distance. Map-based browsing shows what's live around you right now.",
    },
    {
      title: "QR voucher system",
      description: "Every purchase generates a digital voucher with a unique QR code. Walk in, scan, done.",
    },
    {
      title: "AI-powered recommendations",
      description: "Get personalized deal suggestions based on your location, preferences, and purchase history.",
    },
    {
      title: "Verified secure payments",
      description: "Payment gateway integration with full verification. Protected transactions every time.",
    },
    {
      title: "Real-time flash deals",
      description: "Deals go live and expire in real time. Countdown timers keep you in the loop.",
    },
    {
      title: "Reviews & favorites",
      description: "Save deals you love, read reviews from other customers, and build your local deal map.",
    },
  ];

  return (
    <section
      id="about"
      className="border-t border-[#F0F0F0] bg-white py-24"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="grid gap-16 lg:grid-cols-[1fr_1.4fr]">

          {/* Left — sticky heading */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
              Why HitMeUp
            </p>

            <h2 className="mt-3 text-[32px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#1A1A1A]">
              Built for how
              <br />
              people actually
              <br />
              <span className="serif text-[#E8503A]">find good deals.</span>
            </h2>

            <p className="mt-5 max-w-[360px] text-[15px] leading-[1.7] text-[#6A6A6A]">
              Not another coupon app. HitMeUp is a real-time marketplace that
              connects nearby businesses with nearby customers.
            </p>
          </div>

          {/* Right — feature list */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-[#F0F0F0] bg-[#F0F0F0] sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group bg-white p-7 transition-colors duration-200 hover:bg-[#FAFAFA]"
              >
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.7] text-[#8A8A8A]">
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