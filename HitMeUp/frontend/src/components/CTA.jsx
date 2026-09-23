function CTA() {
  return (
    <section
      id="signup"
      className="relative overflow-hidden bg-[#141922] py-20"
    >
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#FF4A2F]/20 blur-3xl" />
      <div className="absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-[#FF4A2F]/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-5 text-center md:flex-row md:px-8 md:text-left">

        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-[#FF4A2F]">
            Start Saving Today
          </p>

          <h2 className="mt-3 text-4xl font-black text-white">
            Ready to Save Big?
          </h2>

          <p className="mt-4 max-w-xl text-gray-400">
            Join thousands of happy users and start grabbing
            the best local deals today!
          </p>
        </div>

        <button className="shrink-0 rounded-xl bg-[#FF4A2F] px-8 py-4 font-black text-white transition hover:bg-[#C72814]">
          Sign Up Now →
        </button>

      </div>
    </section>
  );
}

export default CTA;