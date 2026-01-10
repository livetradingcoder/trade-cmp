import Hero from "../components/Hero";
import StatsBar from "../components/StatsBar";
import KeyFeatures from "../components/KeyFeatures";
import ChampionshipHub from "../components/ChampionshipHub";
import HowItWorks from "../components/HowItWorks";
import TheGoal from "../components/TheGoal";
import FAQ from "../components/FAQ";

const HomePage = () => {
  return (
    <>
      <Hero />
      <StatsBar />
      <ChampionshipHub />
      <HowItWorks />
      <KeyFeatures />
      <TheGoal />
      <FAQ />
    </>
  );
};

export default HomePage;
