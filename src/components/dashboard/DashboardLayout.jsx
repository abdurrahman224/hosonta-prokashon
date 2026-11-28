import { useEffect, useMemo, useRef, useState } from 'react'
import { FiChevronDown, FiGlobe, FiLogOut, FiMenu, FiMessageCircle, FiX } from 'react-icons/fi'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useChat } from '../../context/useChat'
import { isManagementRole } from '../../utils/liveChatStorage'
import LiveChatWidget from '../chat/LiveChatWidget'
import RoleBadge from './RoleBadge'
import sidebarConfig from './sidebarConfig'
import ErrorBoundary from '../common/ErrorBoundary'
import { PageTransition } from '../common/Motion'
import SEO from '../common/SEO'
import {
  applyDashboardDomTranslations,
  translateDashboardText,
} from '../../utils/dashboardTranslations'

function DashboardLayout() {
  const { currentUser, can, logout } = useAuth()
  const { totalStaffUnreadCount } = useChat()
  const isStaff = isManagementRole(currentUser.role)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [openFolders, setOpenFolders] = useState({})
  const [language, setLanguage] = useState(() =>
    localStorage.getItem('hosonta_dashboard_language') === 'bn' ? 'bn' : 'en',
  )
  const mainRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const labelTranslations = {
    Overview: 'সারসংক্ষেপ',
    'All Users': 'সকল ইউজার',
    Users: 'ইউজার',
    Wholesale: 'পাইকারি',
    Shop: 'পাইকারি',
    Employee: 'কর্মচারী',
    'Expense Profiles': 'খরচ প্রোফাইল',
    'User Follow-Ups': 'ইউজার ফলোআপ',
    Roles: 'রোল',
    'Total Cost': 'সর্বমোট খরচ',
    'All Books': 'সব বই',
    'Review Moderation': 'রিভিউ নিয়ন্ত্রণ',
    Authors: 'লেখক',
    Magazine: 'ম্যাগাজিন',
    'Counter Sales': 'কাউন্টার বিক্রি',
    'Online Orders': 'অনলাইন অর্ডার',
    'Stock Inventory': 'স্টক ইনভেন্টরি',
    Manually: 'ম্যানুয়াল',
    Manuscripts: 'পাণ্ডুলিপি',
    'Live Chat': 'লাইভ চ্যাট',
    Messages: 'বার্তা',
    Reports: 'রিপোর্ট',
    Settings: 'সেটিংস',
    'Review Queue': 'রিভিউ কিউ',
    'Magazine Reviews': 'ম্যাগাজিন রিভিউ',
    'Message Moderation': 'বার্তা নিয়ন্ত্রণ',
    'My Books': 'আমার বই',
    'Book Reviews': 'বই রিভিউ',
    'Publishing Terms': 'প্রকাশনা নীতিমালা',
    'Submit Manuscript': 'পাণ্ডুলিপি জমা',
    'My Profile': 'আমার প্রোফাইল',
    'Sales Analytics': 'বিক্রয় পরিসংখ্যান',
    Orders: 'অর্ডার',
    'My Orders': 'আমার অর্ডার',
    Addresses: 'ঠিকানা',
    Wishlist: 'ইচ্ছেতালিকা',
    'My Reviews': 'আমার রিভিউ',
    'Message Support': 'সহায়তা বার্তা',
  }

  const translateLabel = label =>
    language === 'bn' ? labelTranslations[label] || label : label

  const changeLanguage = nextLanguage => {
    setLanguage(nextLanguage)
    localStorage.setItem('hosonta_dashboard_language', nextLanguage)
    document.documentElement.lang = nextLanguage === 'bn' ? 'bn' : 'en'
  }

  useEffect(() => {
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en'
  }, [language])

  useEffect(() => {
    if (!mainRef.current) return

    const root = mainRef.current
    let frameId

    const applyTranslations = () => {
      cancelAnimationFrame(frameId)
      frameId = requestAnimationFrame(() => {
        applyDashboardDomTranslations(root, language)
      })
    }

    applyTranslations()
    const observer = new MutationObserver(applyTranslations)
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    })

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
    }
  }, [language, location.pathname])

  const menuItems = useMemo(
    () =>
      (sidebarConfig[currentUser.role] ?? []).filter((item) => can(item.permission)),
    [can, currentUser.role],
  )
  const activeItem =
    menuItems.find((item) => location.pathname === item.path) ??
    menuItems.find((item) => location.pathname.startsWith(`${item.path}/`))

  useEffect(() => {
    const activeFolder = menuItems.find((item) =>
      item.children?.some((child) => location.pathname === child.path),
    )
    if (activeFolder) {
      setOpenFolders((current) => ({ ...current, [activeFolder.path]: true }))
    }
  }, [location.pathname, menuItems])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      <a href="#main-content" className="sr-only fixed left-4 top-4 z-[130] rounded-md bg-primary px-4 py-2 font-semibold text-dark focus:not-sr-only">
        Skip to main content
      </a>
      <SEO title="Dashboard | Hosonta Prokashon" description="Hosonta Prokashon management dashboard." noIndex />
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-dark/60 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-dark text-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
            <Link
              to="/"
              onClick={() => setIsSidebarOpen(false)}
              title="Visit Website"
              className="group block leading-none transition"
            >
              <span className="block font-heading text-2xl font-bold text-primary transition duration-200 group-hover:text-primary-hover">
                Hosonta
              </span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold tracking-[0.2em] text-white/60 transition duration-200 group-hover:text-white">
                Dashboard
                <span className="text-[10px] text-primary transition duration-200 group-hover:translate-x-0.5">↗</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 text-xl text-white/70 hover:bg-white/10 lg:hidden"
              aria-label="Close sidebar"
            >
              <FiX />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-5 [scrollbar-width:thin]">
            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
              {language === 'bn' ? 'মেনু' : 'MENU'}
            </p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const children = (item.children ?? []).filter((child) => can(child.permission))
                const isFolderOpen = openFolders[item.path]
                const hasActiveChild = children.some((child) => location.pathname === child.path)

                if (!children.length) {
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-200 ${
                          isActive
                            ? 'bg-primary font-bold text-dark shadow-sm shadow-primary/20'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`
                      }
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon className="text-lg shrink-0" />
                      <span className="flex-1 truncate">{translateLabel(item.label)}</span>
                      {item.path === '/dashboard/live-chat' && totalStaffUnreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[10px] font-bold text-white">
                          {totalStaffUnreadCount > 99 ? '99+' : totalStaffUnreadCount}
                        </span>
                      )}
                    </NavLink>
                  )
                }

                return (
                  <div key={item.path}>
                    <div
                      className={`flex items-center rounded-xl text-sm font-medium transition duration-200 ${
                        hasActiveChild
                          ? 'bg-primary font-bold text-dark shadow-sm shadow-primary/20'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <NavLink
                        to={children[0].path}
                        className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5"
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <Icon className="text-lg shrink-0" />
                        <span className="truncate">{translateLabel(item.label)}</span>
                      </NavLink>
                      <button
                        type="button"
                        aria-label={`${isFolderOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                        aria-expanded={isFolderOpen}
                        onClick={() =>
                          setOpenFolders((current) => ({
                            ...current,
                            [item.path]: !isFolderOpen,
                          }))
                        }
                        className="px-3.5 py-2.5"
                      >
                        <FiChevronDown
                          className={`transition-transform ${isFolderOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                    {isFolderOpen && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-white/15 pl-3">
                        {children.map((child) => {
                          const ChildIcon = child.icon
                          return (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                  isActive
                                    ? 'bg-primary/90 font-semibold text-dark'
                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                }`
                              }
                              onClick={() => setIsSidebarOpen(false)}
                            >
                              <ChildIcon className="text-base shrink-0" />
                              <span className="truncate">{translateLabel(child.label)}</span>
                            </NavLink>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>
          <div className="border-t border-white/10 p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <FiLogOut className="text-lg" />
              <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72 bg-white min-h-screen">
        <header className="sticky top-0 z-20 border-b border-dark/10 bg-white">
          <div className="flex min-h-18 items-center justify-between gap-4 px-5 py-3 md:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-lg p-2 text-xl text-dark hover:bg-dark/5 lg:hidden"
                aria-label="Open sidebar"
              >
                <FiMenu />
              </button>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-xl font-bold text-dark md:text-2xl">
                  {translateLabel(activeItem?.label ?? 'Dashboard')}
                </h1>
                <p className="hidden text-xs text-dark-muted sm:block">
                  {language === 'bn'
                    ? 'হসন্ত প্রকাশন ব্যবস্থাপনা'
                    : 'Hosonta Prokashon Management'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-4">
              {isStaff && (
                <Link
                  to="/dashboard/live-chat"
                  title="Live Chat"
                  aria-label="Open Live Chat"
                  className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                    location.pathname === '/dashboard/live-chat'
                      ? 'border-slate-900 bg-slate-100 text-slate-900'
                      : 'border-dark/10 bg-white text-dark hover:bg-slate-100'
                  }`}
                >
                  <FiMessageCircle size={17} />
                  {totalStaffUnreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">
                      {totalStaffUnreadCount > 99 ? '99+' : totalStaffUnreadCount}
                    </span>
                  )}
                </Link>
              )}
              <div
                className="flex items-center rounded-lg border border-dark/10 bg-white p-0.5"
                role="group"
                aria-label="Dashboard language"
              >
                <FiGlobe className="ml-2 mr-1 text-dark-muted" size={14} />
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    language === 'en'
                      ? 'bg-primary text-dark'
                      : 'text-dark-muted hover:bg-dark/5'
                  }`}
                  aria-pressed={language === 'en'}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('bn')}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    language === 'bn'
                      ? 'bg-primary text-dark'
                      : 'text-dark-muted hover:bg-dark/5'
                  }`}
                  aria-pressed={language === 'bn'}
                >
                  বাংলা
                </button>
              </div>
              <div className="flex items-center gap-3 border-l border-dark/10 pl-3">
                <img
                  src={currentUser.avatar}
                  alt={`${currentUser.name}'s profile avatar`}
                  width="40"
                  height="40"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/40 shadow-xs"
                />
                <div className="hidden xl:block">
                  <p className="max-w-36 truncate text-sm font-semibold text-dark leading-tight">
                    {currentUser.name}
                  </p>
                  <div className="mt-0.5">
                    <RoleBadge role={currentUser.role} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main ref={mainRef} id="main-content" tabIndex="-1" className="px-3.5 py-4 sm:py-6 outline-none  bg-white min-h-[calc(100vh-4.5rem)]">
          {currentUser.status === 'pending' && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-800 shadow-xs">
              Your author account is pending verification. Some publishing features remain restricted until approved.
            </div>
          )}
          <ErrorBoundary>
            <PageTransition>
              <Outlet context={{ language, changeLanguage }} />
            </PageTransition>
          </ErrorBoundary>
        </main>
      </div>
      {!isStaff && <LiveChatWidget />}
    </div>
  )
}

export default DashboardLayout
