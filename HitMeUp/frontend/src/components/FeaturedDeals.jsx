import { deals } from "../data/deals";
import DealCard from "./DealCard";
import { useEffect, useRef } from "react";

function FeaturedDeals() {
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
      { threshold: 0.05 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="deals"
      className="bg-[#F7F5F2] py-20"
    >
      <div
        ref={sectionRef}
        className="reveal mx-auto max-w-[1200px] px-6"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.15em] text-[#E8503A]">
              Live now
            </p>
            <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.03em] text-[#1A1A1A]">
              Deals near you
            </h2>
          </div>

          <button className="flex items-center gap-1 text-[14px] font-semibold text-[#4A4A4A] transition-colors hover:text-[#1A1A1A]">
            See all deals →
          </button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedDeals;