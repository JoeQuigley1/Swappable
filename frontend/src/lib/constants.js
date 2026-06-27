// constants used across the application
export const BRAND_COLOR = '#34BBCC';

// routes that render their own full-bleed dark hero. the navbar is
// transparent over these and solid (so its links stay visible) elsewhere.
export const HERO_ROUTES = ['/', '/how-it-works'];

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
