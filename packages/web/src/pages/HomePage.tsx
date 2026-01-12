import Hero from "../components/Hero";
import StatsBar from "../components/StatsBar";
import KeyFeatures from "../components/KeyFeatures";
import WhyDifferent from "../components/WhyDifferent";
import HowItWorks from "../components/HowItWorks";
import TheGoal from "../components/TheGoal";
import FAQ from "../components/FAQ";

const HomePage = () => {
  return (
    <>
      <Hero />
      <StatsBar />
      <WhyDifferent />
      <HowItWorks />
      <KeyFeatures />
      <TheGoal />
      <FAQ />
    </>
  );
};

export default HomePage;
