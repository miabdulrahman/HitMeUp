import { deals } from "../data/deals";
import DealCard from "./DealCard";

function FeaturedDeals() {
  return (
    <section
      id="deals"
      className="bg-[#f5f2ea] py-20"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">

        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#ef5738]">
              Live around you
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#141922]">
              Deals worth leaving home for
            </h2>
          </div>

          <button className="flex items-center gap-2 font-bold text-[#ef5738]">
            See all deals <span aria-hidden="true">→</span>
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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