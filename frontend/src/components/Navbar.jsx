import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FlaskConical, LayoutDashboard, BookOpen, ShieldCheck,
  LogOut, Menu, X, User, ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/catalog', label: 'Equipment', icon: FlaskConical },
    { to: '/my-bookings', label: 'My Bookings', icon: BookOpen },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: ShieldCheck }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/catalog" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">SmartLab</p>
              <p className="text-xs text-gray-500 leading-tight">Resource Reservation</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(to)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
            }`}>
              {isAdmin ? '⚡ Admin' : '🎓 Student'}
            </span>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(to) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
