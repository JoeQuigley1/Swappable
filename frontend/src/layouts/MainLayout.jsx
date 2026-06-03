import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function MainLayout() {
  const location = useLocation();
  // home page's HeroSection already accounts for the absolute navbar.
  // other routes need top padding so content isn't hidden underneath it.
  const isHome = location.pathname === '/';

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main
        className="flex-grow-1"
        style={!isHome ? { paddingTop: '128px' } : undefined}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
