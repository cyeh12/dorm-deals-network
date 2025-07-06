import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AppNavbar from './components/AppNavbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ComingSoonPage from './pages/ComingSoonPage';
import PostItemPage from './pages/PostItemPage';
import MyListingsPage from './pages/MyListingsPage';
// import MarketplacePage from './pages/MarketplacePage';
// import ItemDetailPage from './pages/ItemDetailPage';
// import StudyGroupsPage from './pages/StudyGroupsPage';
// import UserDashboardPage from './pages/UserDashboardPage';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <AppNavbar />
        <div className="content-wrap">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/post-item" element={<PostItemPage />} />
            <Route path="/browse" element={<ComingSoonPage feature="Browse Items" />} />
            <Route path="/messages" element={<ComingSoonPage feature="Messages" />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/marketplace" element={<ComingSoonPage feature="Marketplace" />} />
            <Route path="/study-groups" element={<ComingSoonPage feature="Study Groups" />} />
            {/* <Route path="/marketplace" element={<MarketplacePage />} /> */}
            {/* <Route path="/items/:id" element={<ItemDetailPage />} /> */}
            {/* <Route path="/post-item" element={<PostItemPage />} /> */}
            {/* <Route path="/study-groups" element={<StudyGroupsPage />} /> */}
            {/* <Route path="/dashboard" element={<UserDashboardPage />} /> */}
          </Routes>
        </div>
        <Footer />
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;