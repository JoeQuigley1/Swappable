import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import SwapRequests from './pages/SwapRequests'
import CreateItem from './pages/CreateItem'
import EditItem from './pages/EditItem'
import MyItems from './pages/MyItems'
import ItemDetail from './pages/ItemDetail'
import NotFound from './pages/NotFound'

// main file of the application
// sets up routing - decides which page to show based on the URL
// every page is wrapped in Layout which adds the navbar and footer
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* home page */}
          <Route path="/" element={<Home />} />

          {/* authentication pages */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* user pages */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/swap-requests" element={<SwapRequests />} />

          {/* item pages */}
          <Route path="/items/create" element={<CreateItem />} />
          <Route path="/items/edit/:id" element={<EditItem />} />
          <Route path="/my-items" element={<MyItems />} />
          <Route path="/items/:id" element={<ItemDetail />} />

          {/* 404 - shown when no route matches */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App