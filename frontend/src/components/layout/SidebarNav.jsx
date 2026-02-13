import { MAIN_NAV_ITEMS, VIEW_ADMIN } from "../../config/views.js";

export default function SidebarNav({ currentView, onNavigate, adminVisible }) {
  return (
    <nav>
      <h3>Navigate</h3>
      {MAIN_NAV_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={currentView === item.key ? "active" : ""}
          onClick={() => onNavigate(item.key)}
        >
          {item.label}
        </button>
      ))}
      {adminVisible && (
        <button
          type="button"
          className={currentView === VIEW_ADMIN ? "active" : ""}
          onClick={() => onNavigate(VIEW_ADMIN)}
        >
          Admin Studio
        </button>
      )}
    </nav>
  );
}
