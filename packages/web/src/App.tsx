import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// Layout Components
import Ticker from "./components/Ticker";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

// Pages
import HomePage from "./pages/HomePage";
import TournamentsPage from "./pages/TournamentsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TermsPage from "./pages/TermsPage";
import RiskWarningPage from "./pages/RiskWarningPage";
import SecurityPage from "./pages/SecurityPage";
import AdminDashboard from "./pages/AdminDashboard";

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin routes without layout */}
        <Route path='/admin/*' element={<AdminDashboard />} />

        {/* Public routes with layout */}
        <Route
          path='*'
          element={
            <div className='app-container'>
              <Ticker />
              <Navbar />
              <main>
                <Routes>
                  <Route path='/' element={<HomePage />} />
                  <Route path='/competitions' element={<TournamentsPage />} />
                  <Route path='/leaderboard' element={<LeaderboardPage />} />
                  <Route path='/terms' element={<TermsPage />} />
                  <Route path='/risk-warning' element={<RiskWarningPage />} />
                  <Route path='/security' element={<SecurityPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </>
  );
}
