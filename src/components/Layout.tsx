"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import "../styles/layout.css"

const navItems = [
  { label: "Dashboard", icon: "🏠", path: "/" },
  { label: "User & Order Lookup", icon: "🔍", path: "/user-order-lookup" },
  { label: "Users", icon: "👤", path: "/users" },
  { label: "Orders", icon: "🛒", path: "/orders" },
  { label: "Food", icon: "🍔", path: "/food" },
  { label: "Grocery", icon: "🛍️", path: "/grocery" },
  { label: "Toyboxz", icon: "🧸", path: "/toyboxz" },
  { label: "Vegetables & Fruits", icon: "🥦", path: "/vegetables-and-fruits" },
  { label: "Delivery Partners", icon: "🚚", path: "/delivery-partners" },
  { label: "Withdrawals", icon: "💸", path: "/withdrawals" },
]

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { email, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        setOpen(false)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleDrawerToggle = () => setOpen(!open)

  const handleNavigation = (path: string) => {
    navigate(path)
    if (isMobile) setOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentItem = navItems.find((item) => item.path === location.pathname)
    return currentItem ? currentItem.label : "Dashboard"
  }

  return (
    <div className="layout-root">
      {/* Mobile Overlay */}
      {isMobile && open && <div className="mobile-overlay" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : "closed"} ${isMobile ? "mobile" : "desktop"}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            {/* <div className="brand-icon">🏢</div> */}
            <span className={`brand-title ${!open ? "hidden" : ""}`}>Hayas Admin</span>
          </div>
          <button className="sidebar-toggle" onClick={handleDrawerToggle}>
            {open ? "✖️" : "☰"}
          </button>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="nav-list">
              {navItems.map((item) => (
                <li key={item.label} className="nav-item">
                  <button
                    className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                    onClick={() => handleNavigation(item.path)}
                    title={!open ? item.label : ""}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className={`nav-label ${!open ? "hidden" : ""}`}>{item.label}</span>
                    {location.pathname === item.path && <div className="active-indicator" />}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          {/* <div className={`user-info ${!open ? "collapsed" : ""}`}>
            <div className="user-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className={`user-details ${!open ? "hidden" : ""}`}>
              <span className="user-email">{email}</span>
              <span className="user-role">Administrator</span>
            </div>
          </div> */}
          <button className="logout-btn" onClick={handleLogout} title={!open ? "Logout" : ""}>
            <span className="logout-icon">🚪</span>
            <span className={`logout-label ${!open ? "hidden" : ""}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${open ? "sidebar-open" : "sidebar-closed"}`}>
        {/* Top Bar */}
        <header className="top-bar">
          <div className="top-bar-left">
            <button className="mobile-menu-btn" onClick={handleDrawerToggle}>
              ☰
            </button>
            <h1 className="page-title">{getCurrentPageTitle()}</h1>
          </div>
          <div className="top-bar-right">
            <div className="user-menu">
              <span className="current-user">{email}</span>
              <button className="user-menu-btn" onClick={handleLogout}>
                🚪
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">{children}</div>
      </main>
    </div>
  )
}

export default Layout
