import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { HERO_ROUTES } from '../lib/constants';

export default function MainLayout() {
  const location = useLocation();
  // routes that render their own full-bleed hero already account for the
  // absolute navbar. other routes need top padding so content isn't hidden
  // underneath it.
  const hasHero = HERO_ROUTES.includes(location.pathname);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main
        className="flex-grow-1"
        style={!hasHero ? { paddingTop: '128px' } : undefined}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
