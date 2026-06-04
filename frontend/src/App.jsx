import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SwapRequestsPage from './pages/SwapRequestsPage.jsx';
import CreateItemPage from './pages/CreateItemPage.jsx';
import EditItemPage from './pages/EditItemPage.jsx';
import MyItemsPage from './pages/MyItemsPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import BrowseItemsPage from './pages/BrowseItemsPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/swap-requests" element={<SwapRequestsPage />} />
          <Route path="/items" element={<BrowseItemsPage />} />
          <Route path="/items/create" element={<CreateItemPage />} />
          <Route path="/items/edit/:id" element={<EditItemPage />} />
          <Route path="/my-items" element={<MyItemsPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
