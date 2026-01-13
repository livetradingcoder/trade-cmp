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
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const location = useLocation();

  // Check if we're on the admin page
  const isAdminPage = location.pathname === "/admin";

  // Render admin dashboard without layout
  if (isAdminPage) {
    return <AdminDashboard />;
  }

  return (
    <div className='app-container'>
      <Ticker />
      <Navbar />

      <main>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/tournaments' element={<TournamentsPage />} />
          <Route path='/leaderboard' element={<LeaderboardPage />} />
          <Route path='/terms' element={<TermsPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
