"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserByEmailQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from "../services/reduxApi"
import "../styles/userPage.css"

interface User {
  _id?: string
  name: string
  phone: string
  email: string
  password?: string
  doorNoAndStreetName: string
  area: string
  place: string
  createdAt?: string
}

const defaultUser: User = {
  name: "",
  phone: "",
  email: "",
  password: "",
  doorNoAndStreetName: "",
  area: "",
  place: "",
}

const UsersPage: React.FC = () => {
  // Modal and form states
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<User>(defaultUser)
  const [details, setDetails] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [error, setError] = useState("")
  const [selectedEmail, setSelectedEmail] = useState<string>("")

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const ITEMS_PER_PAGE = 50

  // API hooks
  const { data: users = [], refetch, isLoading } = useGetUsersQuery()
  const [createUser, { isLoading: creating }] = useCreateUserMutation()
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation()
  const { data: userDetails } = useGetUserByEmailQuery(selectedEmail, {
    skip: !selectedEmail,
  })

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user: User) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.place.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Load more users function
  const loadMoreUsers = useCallback(() => {
    if (isLoadingRef.current || !hasMoreUsers) return

    isLoadingRef.current = true
    setLoadingMoreUsers(true)

    // Simulate loading delay for better UX
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = filteredUsers.slice(startIndex, endIndex)

      if (newItems.length > 0) {
        setDisplayedUsers((prev) => {
          const existingIds = new Set(prev.map((item) => item._id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id))
          return [...prev, ...uniqueNewItems]
        })
        setCurrentPage((prev) => prev + 1)
      }

      // Check if we've loaded all filtered items
      if (endIndex >= filteredUsers.length) {
        setHasMoreUsers(false)
      }

      setLoadingMoreUsers(false)
      isLoadingRef.current = false
    }, 500)
  }, [currentPage, filteredUsers, hasMoreUsers])

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
    setHasMoreUsers(true)
    setDisplayedUsers([])
    isLoadingRef.current = false

    // Load initial items
    if (filteredUsers.length > 0) {
      const initialItems = filteredUsers.slice(0, ITEMS_PER_PAGE)
      setDisplayedUsers(initialItems)
      setCurrentPage(2)
      setHasMoreUsers(filteredUsers.length > ITEMS_PER_PAGE)
    }
  }, [filteredUsers])

  // Scroll event handler with throttling
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Show/hide scroll to top button
      setShowScrollTop(scrollTop > 300)

      // Check if we're near the bottom and should load more
      if (
        scrollTop + windowHeight >= documentHeight - 200 &&
        !loadingMoreUsers &&
        hasMoreUsers &&
        !isLoadingRef.current &&
        displayedUsers.length < filteredUsers.length
      ) {
        loadMoreUsers()
      }
    }, 100)
  }, [loadMoreUsers, loadingMoreUsers, hasMoreUsers, displayedUsers.length, filteredUsers.length])

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [handleScroll])

  // Modal handlers
  const handleOpen = (user?: User) => {
    if (user) {
      setEditId(user._id!)
      setForm(user)
    } else {
      setEditId(null)
      setForm(defaultUser)
    }
    setError("")
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultUser)
    setEditId(null)
    setError("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      if (editId) {
        await updateUser({ email: form.email, data: form }).unwrap()
      } else {
        await createUser(form).unwrap()
      }
      refetch()
      handleClose()
    } catch (err: any) {
      setError(err.data?.error || "Failed to save user")
    }
  }

  const handleDelete = async (email: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      await deleteUser(email).unwrap()
      refetch()
    }
  }

  const handleDetails = async (email: string) => {
    setSelectedEmail(email)
    setDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setDetailsOpen(false)
    setDetails(null)
    setSelectedEmail("")
  }

  // Update details when userDetails changes
  useEffect(() => {
    if (userDetails) {
      setDetails(userDetails.userObject)
    }
  }, [userDetails])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate stats
  const totalUsers = filteredUsers.length
  const displayedCount = displayedUsers.length

  return (
    <div className="users-management">
      <div className="users-container">
        {/* Header */}
        <div className="users-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="users-title">
                <span className="title-icon">👥</span>
                Users Management
              </h1>
              <p className="users-subtitle">Manage and organize user accounts efficiently</p>
            </div>
            <button 
              className="add-user-btn btn btn-primary" 
              onClick={() => handleOpen()} 
              disabled={creating}
            >
              <span className="btn-icon">➕</span>
              Add New User
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="users-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by name, email, phone, or place..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">🔍</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="users-stats">
          <div className="stat-card">
            <div className="stat-number">{totalUsers}</div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{displayedCount}</div>
            <div className="stat-label">Showing Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="users-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading users...</p>
            </div>
          ) : displayedUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No users found</h3>
              <p>{searchTerm ? "Try adjusting your search terms" : "Get started by adding your first user"}</p>
            </div>
          ) : (
            <>
              <div className="users-grid">
                {displayedUsers.map((user) => (
                  <div className="user-card" key={user._id}>
                    <div className="user-avatar-container">
                      <div className="user-avatar">
                        <span className="avatar-text">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="user-overlay">
                        <button 
                          className="action-btn edit-btn" 
                          onClick={() => handleOpen(user)} 
                          title="Edit User"
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => handleDetails(user.email)}
                          title="View Details"
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(user.email)}
                          disabled={deleting}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="user-content">
                      <h3 className="user-name">{user.name}</h3>
                      {/* <p className="user-email">{user.email.substring(0,26)}</p> */}
                      <div className="user-info">
                        <div className="info-item">
                          <span className="info-label">📞 Phone:</span>
                          <span className="info-value">{user.phone}</span>
                        </div>
                        {/* <div className="info-item">
                          <span className="info-label">📍 Place:</span>
                          <span className="info-value">{user.place}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">🏘️ Area:</span>
                          <span className="info-value">{user.area}</span>
                        </div>
                        <div className="info-item full-width">
                          <span className="info-label">🏠 Address:</span>
                          <span className="info-value">{user.doorNoAndStreetName}</span>
                        </div> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMoreUsers && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more users...</p>
                </div>
              )}

              {/* End of Data Indicator */}
              {!hasMoreUsers && displayedUsers.length > 0 && (
                <div className="end-of-data">
                  <div className="end-icon">🎉</div>
                  <p>You've reached the end of the users list</p>
                  <span className="end-subtext">Total: {displayedUsers.length} users</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button className="scroll-to-top" onClick={scrollToTop} title="Scroll to top">
            ⬆️
          </button>
        )}

        {/* Add/Edit Modal */}
        {open && (
          <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <span className="modal-icon">👥</span>
                  {editId ? "Edit User" : "Add New User"}
                </h2>
                <button className="modal-close" onClick={handleClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`form-input ${editId ? "disabled" : ""}`}
                      placeholder="Enter email address"
                      disabled={!!editId}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password {!editId && "*"}</label>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter password"
                      required={!editId}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="doorNoAndStreetName"
                      value={form.doorNoAndStreetName}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Door no & street name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Area *</label>
                    <input
                      type="text"
                      name="area"
                      value={form.area}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter area"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Place/City *</label>
                    <input
                      type="text"
                      name="place"
                      value={form.place}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Enter place/city"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={handleClose} 
                  disabled={creating || updating}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={creating || updating || !form.name || !form.email}
                >
                  {creating || updating ? (
                    <>
                      <div className="spinner-sm"></div>
                      {editId ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      {editId ? "Update User" : "Create User"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsOpen && (
          <div className="modal-overlay" onClick={handleDetailsClose}>
            <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  <span className="modal-icon">👤</span>
                  User Details
                </h2>
                <button className="modal-close" onClick={handleDetailsClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {details ? (
                  <div className="user-details-full">
                    <div className="details-section">
                      <h3>
                        <span className="section-icon">👤</span>
                        Personal Information
                      </h3>
                      <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{details.name}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{details.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{details.phone}</span>
                      </div>
                    </div>
                    <div className="details-section">
                      <h3>
                        <span className="section-icon">📍</span>
                        Address Information
                      </h3>
                      <div className="detail-item">
                        <span className="detail-label">Street:</span>
                        <span className="detail-value">{details.doorNoAndStreetName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Area:</span>
                        <span className="detail-value">{details.area}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Place:</span>
                        <span className="detail-value">{details.place}</span>
                      </div>
                    </div>
                    {details.createdAt && (
                      <div className="details-section">
                        <h3>
                          <span className="section-icon">📅</span>
                          Account Information
                        </h3>
                        <div className="detail-item">
                          <span className="detail-label">Created:</span>
                          <span className="detail-value">
                            {new Date(details.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading user details...</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleDetailsClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
