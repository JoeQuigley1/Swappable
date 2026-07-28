import { useEffect } from 'react';
import { Outlet, useLocation, matchPath } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import {
  HERO_ROUTES,
  PAGE_TITLES,
  DEFAULT_PAGE_TITLE,
  SITE_NAME,
} from '../lib/constants';

export default function MainLayout() {
  const location = useLocation();

  useEffect(() => {
    const match = PAGE_TITLES.find(([pattern]) =>
      matchPath(pattern, location.pathname)
    );
    const title = match ? match[1] : DEFAULT_PAGE_TITLE;
    document.title =
      location.pathname === '/' ? `${SITE_NAME} | ${title}` : `${title} | ${SITE_NAME}`;
  }, [location.pathname]);
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
