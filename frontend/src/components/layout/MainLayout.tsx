import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BookOpen, FileText, LayoutDashboard, Menu, X } from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Notebooks",
    to: "/notebooks",
    icon: BookOpen,
  },
  {
    label: "Documents",
    to: "/documents",
    icon: FileText,
  },
];

interface SidebarProps {
  onClose?: () => void;
}

function Sidebar({ onClose }: SidebarProps) {
  return (
    <div className="flex h-full flex-col bg-[#171717] text-white">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <NavLink
          to="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-black">
            <img
              src="/images/2.png"
              alt="ProfessorMind AI"
              className="h-full w-full object-contain"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-white">
              ProfessorMind
            </div>

            <div className="text-xs text-white/40">AI Learning Assistant</div>
          </div>
        </NavLink>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-2 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="mb-2 px-3 text-xs font-medium text-white/40">
          WORKSPACE
        </div>

        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon size={18} strokeWidth={1.8} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Bottom status */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/40">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>Workspace active</span>
        </div>
      </div>
    </div>
  );
}

function MainLayout() {
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#212121] text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Main application */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex h-12 shrink-0 items-center px-3 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-md p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Page */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#212121]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
