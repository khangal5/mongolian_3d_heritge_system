import { NavLink } from "react-router-dom";

const RESEARCHER_ITEMS = [
  { to: "/dashboard", label: "Хяналтын самбар" },
  { to: "/dashboard", label: "Миний олдворууд", end: false },
  { to: "/artifacts/new", label: "Шинэ олдвор" },
  { to: "/reconstruction-lab", label: "Зургийн багц шалгах" }
];

const ADMIN_ITEMS = [
  { to: "/admin/queue", label: "Олдвор хянах" },
  { to: "/admin/researchers", label: "Судлаачид" },
  { to: "/dashboard", label: "Хяналтын самбар" }
];

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ROLE_LABEL = {
  researcher: "Судлаач",
  admin: "Администратор"
};

export default function UserSidebar({ user }) {
  if (!user) return null;
  const items = user.role === "admin" ? ADMIN_ITEMS : RESEARCHER_ITEMS;

  return (
    <div className="user-sidebar">
      <div className="user-sidebar-profile">
        <div className="user-sidebar-avatar">{initials(user.fullName)}</div>
        <div>
          <div className="user-sidebar-name">{user.fullName}</div>
          <div className="user-sidebar-role">{ROLE_LABEL[user.role] || user.role}</div>
        </div>
      </div>

      <nav className="user-sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            className={({ isActive }) =>
              `user-sidebar-item ${isActive ? "is-active" : ""}`
            }
            end={item.end !== false}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
