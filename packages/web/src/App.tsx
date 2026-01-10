import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

// Layout Components
import Ticker from "./components/Ticker";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ManagerPortal from "./components/ManagerPortal";

// Pages
import HomePage from "./pages/HomePage";
import TournamentsPage from "./pages/TournamentsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TermsPage from "./pages/TermsPage";

export default function App() {
  const [showManager, setShowManager] = useState(false);

  return (
    <div className='app-container'>
      <Ticker />
      <Navbar onOpenManager={() => setShowManager(true)} />

      <main>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/tournaments' element={<TournamentsPage />} />
          <Route path='/leaderboard' element={<LeaderboardPage />} />
          <Route path='/terms' element={<TermsPage />} />
        </Routes>
      </main>

      <Footer />

      <AnimatePresence>{showManager && <ManagerPortal onClose={() => setShowManager(false)} />}</AnimatePresence>
    </div>
  );
}
