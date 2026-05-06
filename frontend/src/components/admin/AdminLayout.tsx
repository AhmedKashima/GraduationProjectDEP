import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Обзор", path: "/admin" },
  { label: "Клиенты", path: "/admin/clients" },
  { label: "Чат", path: "/admin/chat" },
];

const AdminLayout = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          <button
            className="md:hidden bg-slate-600 border-2 border-slate-500"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "Скрыть меню" : "Меню"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <aside
            className={
              open
                ? "bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-4 shadow-lg shadow-slate-800"
                : "hidden md:block bg-slate-800/80 border-2 border-slate-600 rounded-2xl p-4 shadow-lg shadow-slate-800"
            }
          >
            <div className="text-gray-400 text-xs uppercase tracking-widest mb-3">
              Админ раздел
            </div>
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== "/admin" && location.pathname.startsWith(item.path));
                return (
                  <Link key={item.path} to={item.path} onClick={() => setOpen(false)}>
                    <div
                      className={
                        isActive
                          ? "bg-blue-500 text-white border-2 border-blue-800 rounded-xl px-3 py-2"
                          : "bg-slate-700/70 text-gray-200 border-2 border-slate-600 rounded-xl px-3 py-2 hover:bg-blue-600"
                      }
                    >
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
