import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { ShoppingCart, Heart, Sun, Moon, LogOut, LayoutDashboard, User as UserIcon, Menu, X, ShoppingBag, Bell, Search, Package } from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const { wishlistIds } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifCount, setNotifCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!user) { setNotifCount(0); return; }
    const fetchNotifCount = async () => {
      try {
        const API = (await import('../services/api')).default;
        const res = await API.get('/api/notifications/unread-count');
        setNotifCount(res.data.count);
      } catch {}
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const cartCount = getCartCount();
  const wishlistCount = wishlistIds.length;

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 glass-nav shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-primary-600 dark:bg-primary-500 p-2 rounded-lg text-white">
                  <ShoppingBag size={20} />
                </div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-300 hidden sm:inline">
                  SmartCart AI
                </span>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all font-medium"
                />
                <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={15} />
                </button>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-5">
              <Link to="/" className={`font-medium text-sm transition-colors ${isActive('/') ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}>
                Home
              </Link>
              <Link to="/shop" className={`font-medium text-sm transition-colors ${isActive('/shop') ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}>
                Shop
              </Link>
              {user && (
                <Link to="/wishlist" className="relative p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                  <Heart size={18} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
              )}
              {user && (
                <Link to="/dashboard" className="relative p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                  <Bell size={18} />
                  {notifCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>
              )}
              {user && (
                <Link to="/cart" className="relative p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors">
                  <ShoppingCart size={18} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-slate-600" />}
              </button>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 pl-4 border-l border-slate-200 dark:border-slate-800"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
                      {isAdmin ? (
                        <Link to="/admin" className="flex items-center space-x-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <LayoutDashboard size={15} className="text-amber-500" />
                          <span>Admin Panel</span>
                        </Link>
                      ) : (
                        <Link to="/dashboard" className="flex items-center space-x-2 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <UserIcon size={15} className="text-primary-500" />
                          <span>Dashboard</span>
                        </Link>
                      )}

                      <hr className="my-1 border-slate-100 dark:border-slate-800" />
                      <button onClick={handleLogout} className="flex items-center space-x-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <LogOut size={15} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3 pl-4 border-l border-slate-200 dark:border-slate-800">
                  <Link to="/login" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-medium text-sm">
                    Sign In
                  </Link>
                  <Link to="/register" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md shadow-primary-500/10">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center space-x-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300"
              >
                <Search size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {darkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-600" />}
              </button>
              {user && (
                <Link to="/cart" className="relative p-1.5 text-slate-600 dark:text-slate-300">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1 rounded-md text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="md:hidden pb-3">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
                  autoFocus
                />
                <button type="submit" className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={15} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2">
            <Link to="/" className="block px-3 py-2.5 rounded-md font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
              Home
            </Link>
            <Link to="/shop" className="block px-3 py-2.5 rounded-md font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
              Shop
            </Link>
            {user && (
              <>
                <Link to="/wishlist" className="flex items-center space-x-2 px-3 py-2.5 rounded-md font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                  <Heart size={16} />
                  <span>Wishlist</span>
                  {wishlistCount > 0 && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{wishlistCount}</span>}
                </Link>
                <Link to="/cart" className="flex items-center space-x-2 px-3 py-2.5 rounded-md font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                  <ShoppingCart size={16} />
                  <span>Cart</span>
                  {cartCount > 0 && <span className="text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded-full">{cartCount}</span>}
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className="flex items-center space-x-2 px-3 py-2.5 rounded-md font-medium text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                    <LayoutDashboard size={16} />
                    <span>Admin Panel</span>
                  </Link>
                ) : (
                  <Link to="/dashboard" className="flex items-center space-x-2 px-3 py-2.5 rounded-md font-medium text-primary-600 dark:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                    <UserIcon size={16} />
                    <span>Dashboard</span>
                  </Link>
                )}
                <hr className="border-slate-100 dark:border-slate-800 my-1" />
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-3 py-2.5 rounded-md font-medium text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                  Logout
                </button>
              </>
            )}
            {!user && (
              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Link to="/login" className="text-center py-2.5 rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm">
                  Sign In
                </Link>
                <Link to="/register" className="text-center py-2.5 rounded-md font-medium bg-primary-600 text-white hover:bg-primary-700 text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 page-enter">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 dark:bg-slate-950 dark:border-slate-900 py-10 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <span className="font-extrabold text-lg bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent dark:from-primary-400 dark:to-indigo-300">
                SmartCart AI
              </span>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                Next-generation intelligent e-commerce platform using TF-IDF text features & Cosine Similarity vector matching for context-aware product matching.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Tech Stack</h3>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li>React.js & Tailwind CSS</li>
                <li>Spring Boot & MongoDB</li>
                <li>FastAPI Recommendation Service</li>
                <li>Scikit-Learn TF-IDF Models</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">Project Information</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Final Year B.Tech Computer Science & Engineering Major Project. Designed for premium responsiveness and smart personalized item matching.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-900 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
            <p>&copy; {new Date().getFullYear()} SmartCart AI. All rights reserved.</p>
            <p>Designed & Built by CSE Major Project Group</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
