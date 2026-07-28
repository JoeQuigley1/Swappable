// constants used across the application
export const BRAND_COLOR = '#34BBCC';

// routes that render their own full-bleed dark hero. the navbar is
// transparent over these and solid (so its links stay visible) elsewhere.
export const HERO_ROUTES = ['/', '/how-it-works'];

export const SITE_NAME = 'Swappable';

// browser tab title per route. the title in index.html only stays correct for
// the first page loaded, so MainLayout reapplies these on every navigation.
// the list is ordered because matching stops at the first hit and the static
// segments have to be tried before the ':id' patterns.
export const PAGE_TITLES = [
  ['/', 'Swap what you no longer need'],
  ['/how-it-works', 'How it works'],
  ['/register', 'Create an account'],
  ['/login', 'Log in'],
  ['/login/2fa', 'Two-factor authentication'],
  ['/forgot-password', 'Forgot password'],
  ['/reset-password', 'Reset password'],
  ['/profile', 'My profile'],
  ['/profile/delete', 'Delete account'],
  ['/swap-requests', 'Swap requests'],
  ['/my-items', 'My items'],
  ['/items', 'Browse items'],
  ['/items/create', 'List an item'],
  ['/items/edit/:id', 'Edit item'],
  ['/items/:id', 'Item details'],
  ['/users/:id', 'User profile'],
];

// used for any route without an entry above, which is the 404 page
export const DEFAULT_PAGE_TITLE = 'Page not found';

// bootstrap icon for each category name returned by GET /api/categories.
// the backend does not store an icon, so the mapping lives on the frontend.
export const CATEGORY_ICONS = {
  Electronics: 'bi-laptop',
  Books: 'bi-book',
  Clothing: 'bi-bag',
  Furniture: 'bi-house-door',
  Sports: 'bi-bicycle',
  'Home & Garden': 'bi-flower1',
  'Toys & Games': 'bi-controller',
  Other: 'bi-box',
};

// fallback icon for any category without an explicit mapping
export const DEFAULT_CATEGORY_ICON = 'bi-box';

// condition options describe the physical state of the item
export const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// bootstrap badge color for each condition
export const CONDITION_COLORS = {
  'Like New': 'success',
  Good: 'primary',
  Fair: 'warning',
  Poor: 'danger',
};
