import { useEffect, useRef } from "react";

function Testimonials() {
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

  const testimonials = [
    {
      text: "Found a 40% dinner deal two blocks from my apartment. The QR voucher made it seamless — just walked in and scanned.",
      name: "Sarah M.",
      role: "Customer",
      image: "https://i.pravatar.cc/100?img=47",
    },
    {
      text: "Our Tuesday evenings used to be dead. HitMeUp's AI suggested a student deal that actually brought people in. Revenue is up 35%.",
      name: "Rizwan K.",
      role: "Restaurant Owner",
      image: "https://i.pravatar.cc/100?img=68",
    },
    {
      text: "I check HitMeUp every morning before heading out. The location-based deals are genuinely useful — not just spam offers.",
      name: "Emily R.",
      role: "Customer",
      image: "https://i.pravatar.cc/100?img=32",
    },
  ];

  return (
    <section className="border-t border-[#F0F0F0] bg-white py-24">
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
          What people say
        </p>

        <h2 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-[#1A1A1A]">
          Real stories, real savings
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col justify-between rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-7"
            >
              <p className="text-[15px] leading-[1.75] text-[#4A4A4A]">
                "{t.text}"
              </p>

              <div className="mt-8 flex items-center gap-3 border-t border-[#F0F0F0] pt-5">
                <img
                  src={t.image}
                  alt={t.name}
                  className="h-10 w-10 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-[14px] font-semibold text-[#1A1A1A]">{t.name}</p>
                  <p className="text-[12px] text-[#8A8A8A]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;