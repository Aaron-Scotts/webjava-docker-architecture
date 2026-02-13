export const VIEW_AUTH = "auth";
export const VIEW_DASHBOARD = "dashboard";
export const VIEW_LIBRARY = "library";
export const VIEW_FAVORITES = "favorites";
export const VIEW_RENTALS = "rentals";
export const VIEW_ANALYTICS = "analytics";
export const VIEW_ADMIN = "admin";

export const MAIN_NAV_ITEMS = [
  { key: VIEW_DASHBOARD, label: "Home" },
  { key: VIEW_LIBRARY, label: "Library" },
  { key: VIEW_FAVORITES, label: "Favorites" },
  { key: VIEW_RENTALS, label: "Rentals" },
  { key: VIEW_ANALYTICS, label: "Analytics" },
];

export const VIEW_PATHS = {
  [VIEW_AUTH]: "/auth",
  [VIEW_DASHBOARD]: "/dashboard",
  [VIEW_LIBRARY]: "/library",
  [VIEW_FAVORITES]: "/favorites",
  [VIEW_RENTALS]: "/rentals",
  [VIEW_ANALYTICS]: "/analytics",
  [VIEW_ADMIN]: "/admin",
};

export function viewToPath(view) {
  return VIEW_PATHS[view] || VIEW_PATHS[VIEW_AUTH];
}

export function pathToView(pathname) {
  const cleaned = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const normalizedPath = cleaned === "/" ? VIEW_PATHS[VIEW_AUTH] : cleaned;
  const matched = Object.entries(VIEW_PATHS).find(([, path]) => path === normalizedPath);
  return matched ? matched[0] : VIEW_AUTH;
}
