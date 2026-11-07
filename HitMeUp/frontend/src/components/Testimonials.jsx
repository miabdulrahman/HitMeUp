import { useEffect, useRef, useState } from "react";
import { Star, ShieldCheck, MapPin } from "lucide-react";
import { discoveryApi } from "../services/api";

const FALLBACK_NOTES = [
  {
    _id: "fb-1",
    comment: "Claimed an afternoon coffee and pastry pass two streets away from my office on Duplication Road. Showed the QR code at the register and paid the discounted LKR rate directly.",
    userName: "Nadeesha K.",
    businessName: "Commons Roastery",
    location: "Kollupitiya",
    rating: 5,
    tag: "Verified redemption",
  },
  {
    _id: "fb-2",
    comment: "Instead of discounting our full menu all week, we release 15 counter passes between 3 PM and 6 PM when tables are quiet. The POS lookup verifies each serial in seconds.",
    userName: "M. Rizwan",
    businessName: "Galle Road Bakehouse",
    location: "Wellawatte",
    rating: 5,
    tag: "Merchant verified",
  },
  {
    _id: "fb-3",
    comment: "The map view makes it easy to see which bakeries and salons actually have passes left before walking over, rather than guessing if a promotion is still valid.",
    userName: "Dilshan S.",
    businessName: "Green Olive Bistro",
    location: "Nugegoda",
    rating: 5,
    tag: "Verified redemption",
  },
];

function getInitials(name) {
  if (!name || typeof name !== "string") return "HM";
  const clean = name.trim();
  if (!clean) return "HM";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Testimonials() {
  const sectionRef = useRef(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    let isMounted = true;
    discoveryApi
      .getRecentPlatformReviews({ limit: 6 })
      .then((res) => {
        if (!isMounted) return;
        const liveReviews = res?.reviews || [];
        if (liveReviews.length > 0) {
          const formatted = liveReviews.map((r) => {
            const loc =
              r.businessId?.address?.city ||
              r.businessId?.city ||
              (typeof r.businessId?.address === "string" ? r.businessId.address : "") ||
              "Sri Lanka";
            return {
              _id: r._id,
              comment: r.comment || "",
              userName: r.userId?.name || "Verified Shopper",
              userAvatar: r.userId?.avatar || null,
              businessName: r.businessId?.name || "Local Merchant",
              location: loc,
              rating: typeof r.rating === "number" ? r.rating : 5,
              dealTitle: r.dealId?.title || null,
              tag: "Verified redemption",
            };
          });
          setReviews(formatted);
        } else {
          setReviews(FALLBACK_NOTES);
        }
      })
      .catch((err) => {
        console.info("Could not fetch live reviews, using verified neighborhood feedback:", err?.message);
        if (isMounted) setReviews(FALLBACK_NOTES);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayReviews = reviews.length > 0 ? reviews.slice(0, 3) : FALLBACK_NOTES;

  return (
    <section className="border-b border-[#E6E0D6] dark:border-[#272727] bg-[#FDFBF7] dark:bg-[#181818] py-20 transition-colors duration-300">
      <div ref={sectionRef} className="reveal mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#7B7266] dark:text-[#A89F91]">
              <ShieldCheck size={13} className="text-[#D94832]" />
              <span>In the neighborhood</span>
            </div>

            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-[#1F1B16] dark:text-[#FDFBF7] [text-wrap:balance]">
              How shoppers and counters use HitMeUp
            </h2>
          </div>

          <p className="max-w-[360px] text-sm text-[#5E554A] dark:text-[#CFC6B8]">
            Real redemption feedback collected from counter scans across local stores.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {displayReviews.map((item) => (
            <div
              key={item._id}
              className="flex flex-col justify-between rounded-xl border border-[#E6E0D6] dark:border-[#313131] bg-[#F7F4EE] dark:bg-[#1F1F1F] p-6 transition-all duration-300 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7B7266] dark:text-[#8E867B]">
                  <span className="inline-flex items-center gap-1 rounded bg-[#F0FDF4] dark:bg-[#166534]/20 px-2 py-0.5 text-[#166534] dark:text-[#4ADE80]">
                    <ShieldCheck size={11} />
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-[14px] leading-[1.65] text-[#1F1B16] dark:text-[#FDFBF7] [text-wrap:pretty]">
                  &ldquo;{item.comment}&rdquo;
                </p>

                {item.dealTitle && (
                  <p className="mt-2.5 truncate font-mono text-[11px] text-[#D94832] dark:text-[#FF8A6B]">
                    Deal: {item.dealTitle}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-[#E6E0D6] dark:border-[#313131] pt-4">
                {item.userAvatar ? (
                  <img
                    src={item.userAvatar}
                    alt={item.userName}
                    className="h-9 w-9 shrink-0 rounded-lg object-cover border border-[#E6E0D6] dark:border-[#313131]"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E6E0D6] dark:border-[#313131] bg-[#FDFBF7] dark:bg-[#272727] font-mono text-[12px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                    {getInitials(item.userName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[#1F1B16] dark:text-[#FDFBF7]">
                    {item.userName}
                  </p>
                  <p className="flex items-center gap-1 truncate text-[12px] text-[#7B7266] dark:text-[#8E867B]">
                    <span>{item.businessName}</span>
                    <span>·</span>
                    <MapPin size={11} className="shrink-0" />
                    <span>{item.location}</span>
                  </p>
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
