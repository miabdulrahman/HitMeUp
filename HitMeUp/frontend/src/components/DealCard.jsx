import {
  Heart,
  MapPin,
  Clock3,
} from "lucide-react";

function DealCard({ deal }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[#F0F0F0] bg-white transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">

      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute left-3 top-3 rounded-md bg-[#1A1A1A] px-2.5 py-1 text-[11px] font-bold text-white">
          {deal.discount}
        </div>

        <button
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#8A8A8A] backdrop-blur-sm transition-colors duration-200 hover:text-[#E8503A]"
          aria-label="Save deal"
        >
          <Heart size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">

        <div className="flex items-center gap-2">
          <span className="rounded bg-[#F7F5F2] px-2 py-0.5 text-[11px] font-semibold text-[#4A4A4A]">
            {deal.category}
          </span>
        </div>

        <h3 className="mt-3 text-[16px] font-bold text-[#1A1A1A]">
          {deal.title}
        </h3>

        <p className="mt-1 text-[13px] text-[#8A8A8A]">
          {deal.business}
        </p>

        <div className="mt-3 flex items-center gap-4 text-[12px] text-[#8A8A8A]">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {deal.distance}
          </span>

          <span className="flex items-center gap-1">
            <Clock3 size={12} />
            {deal.time}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-[#F0F0F0] pt-4">
          <div className="whitespace-nowrap">
            <span className="text-[20px] font-extrabold text-[#1A1A1A]">
              {deal.price}
            </span>
            <span className="ml-2 text-[13px] text-[#CACACA] line-through">
              {deal.oldPrice}
            </span>
          </div>

          <button className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-[13px] font-semibold text-white transition-all duration-200 hover:bg-[#E8503A]">
            Grab deal
          </button>
        </div>

      </div>
    </article>
  );
}

export default DealCard;