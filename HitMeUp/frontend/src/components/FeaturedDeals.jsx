import { useState, useEffect, useRef } from "react";
import { deals as initialMockDeals } from "../data/deals";
import DealCard from "./DealCard";
import { dealApi } from "../services/api";

function FeaturedDeals() {
  const sectionRef = useRef(null);
  const [dealsList, setDealsList] = useState(initialMockDeals);
  const [loading, setLoading] = useState(false);

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

  // Fetch backend deals if available
  useEffect(() => {
    let isMounted = true;
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const response = await dealApi.getDeals();
        const liveDeals = response.deals || response.data || [];

        if (isMounted && Array.isArray(liveDeals) && liveDeals.length > 0) {
          // Adapt backend deal model to frontend card props
          const formattedDeals = liveDeals.map((d, index) => ({
            id: d._id || index + 1,
            title: d.title,
            business: d.businessName || "Partner Store",
            category: d.category || "Special Offer",
            price: `Rs. ${d.discountedPrice?.toLocaleString() || d.price || "0"}`,
            oldPrice: `Rs. ${d.originalPrice?.toLocaleString() || d.oldPrice || "0"}`,
            discount: `${d.discountPercentage || 0}% OFF`,
            image:
              d.image ||
              initialMockDeals[index % initialMockDeals.length]?.image ||
              "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80",
            time: "Limited time",
            distance: d.distance || "Nearby",
          }));
          setDealsList(formattedDeals);
        }
      } catch (err) {
        // Fall back gracefully to local deals if API is not yet seeded
        console.info("Using featured deals catalog:", err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDeals();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section id="deals" className="bg-[#F7F5F2] py-20">
      <div ref={sectionRef} className="reveal mx-auto max-w-[1200px] px-6">
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
          {dealsList.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedDeals;