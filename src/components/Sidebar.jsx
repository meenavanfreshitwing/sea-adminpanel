import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react';

import { Link, useLocation } from 'react-router-dom';

import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Users,
  Settings,
  Tag,
  Menu,
  X,
  Eye,
  LogOut,
  FileSignature,
  Shield,
  Truck,
  Ship,
  RotateCcw,
  CalendarDays,
  Scale,
  Star
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';

const SIDEBAR_SCROLL_KEY = 'admin-sidebar-scroll';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const [isMobile, setIsMobile] = useState(
    window.innerWidth < 1024
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navRef = useRef(null);

  // Keep latest scroll position in memory
  const scrollPositionRef = useRef(0);

  // Prevent unnecessary storage writes
  const saveFrameRef = useRef(null);

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      path: '/categories',
      label: 'Categories',
      icon: Tag
    },
    {
      path: '/products',
      label: 'Products',
      icon: Package
    },
    {
      path: '/orders',
      label: 'Orders',
      icon: ClipboardList
    },
    {
      path: '/booking-calendar',
      label: 'Booking Calendar',
      icon: CalendarDays
    },
    {
      path: '/delivery-summary',
      label: 'Delivery Summary',
      icon: Scale
    },
    {
      path: '/reviews',
      label: 'Reviews',
      icon: Star
    },
    {
      path: '/customers',
      label: 'Customers',
      icon: Users
    },
    {
      path: '/delivery-boys',
      label: 'Delivery Boys',
      icon: Truck
    },
    {
      path: '/shipping',
      label: 'Shipping Info',
      icon: Ship
    },
    {
      path: '/returns',
      label: 'Returns Policy',
      icon: RotateCcw
    },
    {
      path: '/terms',
      label: 'Terms of Service',
      icon: FileSignature
    },
    {
      path: '/privacy',
      label: 'Privacy Policy',
      icon: Shield
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  /* =====================================================
     WINDOW RESIZE
  ===================================================== */

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);

      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  /* =====================================================
     INITIAL SCROLL POSITION
  ===================================================== */

  useEffect(() => {
    const saved = sessionStorage.getItem(
      SIDEBAR_SCROLL_KEY
    );

    if (saved !== null) {
      const value = Number(saved);

      if (Number.isFinite(value)) {
        scrollPositionRef.current = value;
      }
    }
  }, []);

  /* =====================================================
     RESTORE SCROLL AFTER ROUTE CHANGE
  ===================================================== */

  useLayoutEffect(() => {
    const nav = navRef.current;

    if (!nav) return;

    const saved = sessionStorage.getItem(
      SIDEBAR_SCROLL_KEY
    );

    if (saved === null) return;

    const scrollTop = Number(saved);

    if (!Number.isFinite(scrollTop)) return;

    /*
     * Directly restore once.
     *
     * No timeout.
     * No multiple animation frames.
     * No smooth scrolling here.
     *
     * This prevents the visible jump/lag.
     */
    nav.scrollTop = scrollTop;

    scrollPositionRef.current = scrollTop;
  }, [location.pathname]);

  /* =====================================================
     SIDEBAR SCROLL
  ===================================================== */

  const handleSidebarScroll = (event) => {
    const scrollTop = event.currentTarget.scrollTop;

    scrollPositionRef.current = scrollTop;

    /*
     * Don't write to sessionStorage on every
     * single scroll event.
     *
     * requestAnimationFrame keeps scrolling smooth.
     */
    if (saveFrameRef.current !== null) {
      return;
    }

    saveFrameRef.current = requestAnimationFrame(() => {
      sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(scrollPositionRef.current)
      );

      saveFrameRef.current = null;
    });
  };

  /* =====================================================
     CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      if (saveFrameRef.current !== null) {
        cancelAnimationFrame(saveFrameRef.current);
      }
    };
  }, []);

  /* =====================================================
     SAVE BEFORE NAVIGATION
  ===================================================== */

  const handleMenuClick = () => {
    const nav = navRef.current;

    if (nav) {
      const currentPosition = nav.scrollTop;

      scrollPositionRef.current = currentPosition;

      sessionStorage.setItem(
        SIDEBAR_SCROLL_KEY,
        String(currentPosition)
      );
    }

    setIsMobileMenuOpen(false);
  };

  /* =====================================================
     MOBILE MENU
  ===================================================== */

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => !previous);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  /* =====================================================
     VIEW WEBSITE
  ===================================================== */

  const openWebsite = () => {
    const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

    if (frontendUrl) {
      window.open(frontendUrl, '_blank');
    }

    closeMobileMenu();
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  return (
    <>
      {/* =================================================
          MOBILE HEADER
      ================================================= */}

      {isMobile && (
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#ff0000]/20 z-40">

          <div className="flex items-center justify-between p-4">

            <h2 className="text-xl font-bold bg-gradient-to-r from-[#ff0000] to-[#cc0000] bg-clip-text text-transparent">
              Admin Panel
            </h2>

            <button
              type="button"
              onClick={toggleMobileMenu}
              className="p-2 text-[#ff0000] hover:text-[#cc0000] transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}

      {isMobileMenuOpen && isMobile && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <div
        className={`
          ${
            isMobile
              ? `
                fixed
                top-0
                left-0
                h-full
                z-40
                transform
                transition-transform
                duration-300
                ease-out
              `
              : `
                sticky
                top-0
                h-screen
              `
          }

          ${
            isMobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0'
          }

          bg-white/95
          backdrop-blur-xl
          text-slate-800
          w-64
          flex-shrink-0
          border-r
          border-[#ff0000]/20
          flex
          flex-col
          overflow-hidden
        `}
      >

        <div className="p-6 flex flex-col h-full overflow-hidden">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex-shrink-0 mb-8 pt-4 pl-2">

            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff0000] to-[#cc0000] bg-clip-text text-transparent">
              Admin Panel
            </h2>

            <p className="text-slate-500 text-sm mt-2">
              Welcome back!
            </p>

            <button
              type="button"
              onClick={openWebsite}
              className="
                mt-4
                w-full
                bg-gradient-to-r
                from-[#ff0000]
                to-[#cc0000]
                text-white
                px-4
                py-3
                rounded-xl
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                hover:from-[#cc0000]
                hover:to-[#aa0000]
                transition-all
                duration-200
                hover:shadow-md
                cursor-pointer
              "
            >
              <Eye size={18} />
              View Website
            </button>

          </div>

          {/* =================================================
              NAVIGATION
          ================================================= */}

          <nav
            ref={navRef}
            onScroll={handleSidebarScroll}
            className="
              flex-1
              overflow-y-auto
              overscroll-contain
              scrollbar-hide
              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >

            <ul className="space-y-2">

              {menuItems.map((item) => {

                const isActive =
                  location.pathname === item.path ||

                  (item.path === '/blogs' &&
                    location.pathname.startsWith('/blogs')) ||

                  (item.path === '/terms' &&
                    location.pathname.startsWith('/terms')) ||

                  (item.path === '/privacy' &&
                    location.pathname.startsWith('/privacy')) ||

                  (item.path === '/delivery-boys' &&
                    location.pathname.startsWith('/delivery-boys')) ||

                  (item.path === '/shipping' &&
                    location.pathname.startsWith('/shipping')) ||

                  (item.path === '/returns' &&
                    location.pathname.startsWith('/returns'));

                const Icon = item.icon;

                return (
                  <li key={item.path}>

                    <Link
                      to={item.path}
                      onClick={handleMenuClick}
                      className={`
                        group
                        flex
                        items-center
                        px-4
                        py-3
                        rounded-xl
                        transition-all
                        duration-200
                        ease-out

                        ${
                          isActive
                            ? `
                              bg-white
                              text-[#ff0000]
                              shadow-md
                              border
                              border-[#ff0000]/30
                            `
                            : `
                              text-slate-600
                              hover:bg-white/80
                              hover:text-[#ff0000]
                              hover:shadow-sm
                            `
                        }
                      `}
                    >

                      <span
                        className={`
                          mr-3
                          text-lg
                          transition-transform
                          duration-200

                          ${
                            isActive
                              ? 'scale-105'
                              : 'group-hover:scale-105'
                          }
                        `}
                      >
                        <Icon
                          size={20}
                          className={
                            isActive
                              ? 'text-[#ff0000]'
                              : 'group-hover:text-[#ff0000]'
                          }
                        />
                      </span>

                      <span className="font-medium tracking-wide">
                        {item.label}
                      </span>

                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 bg-[#ff0000] rounded-full" />
                      )}

                      {!isActive && (
                        <div className="ml-auto w-1 h-5 bg-[#ff0000]/30 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      )}

                    </Link>

                  </li>
                );
              })}

            </ul>

          </nav>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="flex-shrink-0 mt-auto pt-6 border-t border-[#ff0000]/20">

            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full
                bg-gradient-to-r
                from-red-500
                to-red-600
                text-white
                px-4
                py-3
                rounded-xl
                font-semibold
                flex
                items-center
                justify-center
                gap-2
                hover:from-red-600
                hover:to-red-700
                transition-all
                duration-200
                hover:shadow-md
                cursor-pointer
              "
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </div>

      {/* =================================================
          MOBILE SPACER
      ================================================= */}

      {isMobile && (
        <div className="lg:hidden h-16" />
      )}
    </>
  );
};

export default Sidebar;