import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SwapRequests from './pages/SwapRequests';
import CreateItem from './pages/CreateItem';
import EditItem from './pages/EditItem';
import MyItems from './pages/MyItems';
import ItemDetail from './pages/ItemDetail';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/swap-requests" element={<SwapRequests />} />
          <Route path="/items/create" element={<CreateItem />} />
          <Route path="/items/edit/:id" element={<EditItem />} />
          <Route path="/my-items" element={<MyItems />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
