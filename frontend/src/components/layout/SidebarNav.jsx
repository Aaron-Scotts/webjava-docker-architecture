import { NavLink } from "react-router-dom";
import { MAIN_NAV_ITEMS, VIEW_ADMIN, viewToPath } from "../../config/views.js";

export default function SidebarNav({ adminVisible }) {
  return (
    <nav>
      <h3>Navigate</h3>
      {MAIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.key}
          to={viewToPath(item.key)}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          {item.label}
        </NavLink>
      ))}
      {adminVisible && (
        <NavLink
          to={viewToPath(VIEW_ADMIN)}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Admin Studio
        </NavLink>
      )}
    </nav>
  );
}
