import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { User, Settings, History, LayoutDashboard, LogOut } from 'lucide-react';

const ProfileLayout = () => {
  const { user, signOut } = useAuth();

  const navItems = [
    { to: '/profile', icon: User, label: 'Profile', end: true },
    { to: '/profile/settings', icon: Settings, label: 'Settings' },
    { to: '/profile/history', icon: History, label: 'History' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Back to Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-40">
          <div className="p-6 border-b border-slate-100">
            <h1 className="text-xl font-bold text-slate-900">TraceLab</h1>
            <p className="text-xs text-slate-500 mt-1">Account Settings</p>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#2563eb] flex items-center justify-center text-white font-bold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-lg shadow-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Sign Out */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 w-full transition-all"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8">
          <div className="max-w-4xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay - Hidden by default */}
      <div className="lg:hidden fixed inset-0 bg-black/50 z-30 hidden" />
    </div>
  );
};

export default ProfileLayout;
