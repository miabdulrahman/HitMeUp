function CTA() {
  return (
    <section
      id="signup"
      className="relative overflow-hidden bg-[#ef5738] py-20"
    >
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ffb49d]/30 blur-3xl" />
      <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-[#c93e27]/30 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 text-center md:flex-row md:px-8 md:text-left">

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#ffe4d8]">
            Your next good find
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            Something good is nearby.
          </h2>

          <p className="mt-4 max-w-xl text-white/75">
            Join HitMeUp and turn an ordinary day into a better one with
            limited-time deals from places around you.
          </p>
        </div>

        <button className="shrink-0 rounded-xl bg-white px-8 py-4 font-black text-[#c93e27] transition hover:bg-[#fff4ed]">
          Start exploring →
        </button>

      </div>
    </section>
  );
}

export default CTA;