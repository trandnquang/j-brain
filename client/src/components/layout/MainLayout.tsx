import { NavLink, useNavigate } from "react-router-dom";
import { BookOpen, Search, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import type { ReactNode } from "react";

interface MainLayoutProps {
    children: ReactNode;
}

const navItems = [
    { to: "/", icon: Search, label: "Search" },
    { to: "/decks", icon: LayoutDashboard, label: "My Decks" },
];

export function MainLayout({ children }: MainLayoutProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth");
    };

    return (
        <div className="min-h-screen bg-white font-sans antialiased">
            {/* ── TOP NAV ── */}
            <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/80 backdrop-blur-sm">
                <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
                    {/* Logo */}
                    <NavLink
                        to="/"
                        className="flex items-center gap-2 font-bold text-lg tracking-tight"
                    >
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <span>J-Brain</span>
                    </NavLink>

                    {/* Nav links */}
                    <nav className="flex items-center gap-1">
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end
                                className={({ isActive }) =>
                                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        isActive
                                            ? "bg-gray-100 text-gray-900"
                                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                    }`
                                }
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* User + logout */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 hidden sm:block">
                            {user?.email}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="text-gray-500 hover:text-red-600"
                        >
                            <LogOut className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* ── MAIN CONTENT ── */}
            <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
        </div>
    );
}
