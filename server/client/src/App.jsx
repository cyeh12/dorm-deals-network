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
import EditItemPage from './pages/EditItemPage';
import BrowseItemsPage from './pages/BrowseItemsPage';
import ItemDetailPage from './pages/ItemDetailPage';
import SavedItemsPage from './pages/SavedItemsPage';
import MessagingPage from './pages/MessagingPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
// import MarketplacePage from './pages/MarketplacePage';
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
            <Route path="/browse" element={<BrowseItemsPage />} />
            <Route path="/messages" element={<MessagingPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/edit-item/:itemId" element={<EditItemPage />} />
            <Route path="/items/:itemId" element={<ItemDetailPage />} />
            <Route path="/marketplace" element={<BrowseItemsPage />} />
            <Route path="/study-groups" element={<StudyGroupsPage />} />
            <Route path="/saved-items" element={<SavedItemsPage />} />
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