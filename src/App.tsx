import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import CareerRecommendation from './pages/CareerRecommendation';
import ChatbotPage from './pages/ChatbotPage';
import MarketAnalysis from './pages/MarketAnalysis';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/user-profile" element={<UserProfile />} />
            <Route path="/recommendations" element={<CareerRecommendation />} />
            <Route path="/chat" element={<ChatbotPage />} />
            <Route path="/market-analysis" element={<MarketAnalysis />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;