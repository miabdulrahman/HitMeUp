import {
  Heart,
  MapPin,
  Clock3,
} from "lucide-react";

function DealCard({ deal }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">

      {/* Image */}
      <div className="relative h-52 overflow-hidden">

        <img
          src={deal.image}
          alt={deal.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 rounded-lg bg-[#FF4A2F] px-3 py-1.5 text-xs font-black text-white">
          {deal.discount}
        </div>

        <button
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-md transition hover:text-[#FF4A2F]"
          aria-label="Add to wishlist"
        >
          <Heart size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">

        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-[#FF4A2F]">
          {deal.category}
        </span>

        <h3 className="mt-3 text-lg font-black text-[#141922]">
          {deal.title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {deal.business}
        </p>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">

          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-[#1FA061]" />
            {deal.distance}
          </span>

          <span className="flex items-center gap-1">
            <Clock3 size={14} className="text-[#FF4A2F]" />
            Ends in {deal.time}
          </span>

        </div>

        <div className="mt-4 flex items-end justify-between">

          <div>
            <span className="text-2xl font-black text-[#FF4A2F]">
              {deal.price}
            </span>

            <span className="ml-2 text-sm text-gray-400 line-through">
              {deal.oldPrice}
            </span>
          </div>

        </div>

        <button className="mt-4 w-full rounded-xl bg-[#FF4A2F] py-3 font-bold text-white transition hover:bg-[#C72814]">
          Grab Deal
        </button>

      </div>
    </article>
  );
}

export default DealCard;