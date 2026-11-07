import { useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import FeaturedDeals from "../components/FeaturedDeals";
import WhyHitMeUp from "../components/WhyHitMeUp";
import ForBusiness from "../components/ForBusiness";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import FAQ from "../components/FAQ";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function LandingPage() {
  const [heroSearchQuery, setHeroSearchQuery] = useState("");

  const handleHeroSearch = (query) => {
    setHeroSearchQuery(query);
    const dealsSection = document.getElementById("deals");
    if (dealsSection) {
      dealsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero onSearch={handleHeroSearch} />
        <CategorySection />
        <FeaturedDeals initialSearch={heroSearchQuery} />
        <WhyHitMeUp />
        <ForBusiness />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export default LandingPage;
