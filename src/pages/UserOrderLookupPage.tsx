"use client"

import React from "react"
import { useState, useEffect } from "react"
import {
  useGetUserByEmailQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetOrderByEmailQuery,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
  useGetUsersQuery,
} from "../services/reduxApi"
import '../styles/userOrderLookupPage.css'

const statusOptions = ["PENDING", "CANCELLED"]

const UserOrderLookupPage: React.FC = () => {
  const [search, setSearch] = useState("")
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [order, setOrder] = useState<any>(null)
  const [userError, setUserError] = useState("")
  const [orderError, setOrderError] = useState("")
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [editUserForm, setEditUserForm] = useState<any>(null)
  const [editOrderId, setEditOrderId] = useState<string | null>(null)
  const [editOrderStatus, setEditOrderStatus] = useState("")
  const [editOrderError, setEditOrderError] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<any>(null)
  const [selectedEmail, setSelectedEmail] = useState<string>("")
  const [selectedOrderEmail, setSelectedOrderEmail] = useState<string>("")

  const [userPage, setUserPage] = useState(1)
  const [hasMoreUsers, setHasMoreUsers] = useState(true)
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false)
  const [displayedUsers, setDisplayedUsers] = useState<any[]>([])

  const { data: allUsers = [], isLoading: loadingUsers } = useGetUsersQuery()
  const { data: userDetails } = useGetUserByEmailQuery(selectedEmail, { skip: !selectedEmail })
  const { data: orderDetails } = useGetOrderByEmailQuery(selectedOrderEmail, { skip: !selectedOrderEmail })
  const { data: allOrders = [], refetch: refetchOrders } = useGetOrdersQuery()
  const [updateUser, { isLoading: updatingUser }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: deletingUser }] = useDeleteUserMutation()
  const [updateOrderStatus, { isLoading: updatingOrder }] = useUpdateOrderStatusMutation()
  const [deleteOrder, { isLoading: deletingOrder }] = useDeleteOrderMutation()

  // Load more users function
  const loadMoreUsers = React.useCallback(async () => {
    if (loadingMoreUsers || !hasMoreUsers) return

    setLoadingMoreUsers(true)
    const nextPage = userPage + 1
    const startIndex = (nextPage - 1) * 50
    const endIndex = startIndex + 50

    // Simulate pagination from allUsers array
    const nextUsers = allUsers.slice(startIndex, endIndex)

    if (nextUsers.length === 0) {
      setHasMoreUsers(false)
    } else {
      setDisplayedUsers((prev) => [...prev, ...nextUsers])
      setUserPage(nextPage)
    }

    setLoadingMoreUsers(false)
  }, [loadingMoreUsers, hasMoreUsers, userPage, allUsers]);

  // Add useEffect for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight ||
        loadingMoreUsers ||
        !hasMoreUsers
      ) {
        return
      }
      loadMoreUsers()
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadingMoreUsers, hasMoreUsers, loadMoreUsers])

  // Initialize displayed users
  useEffect(() => {
    if (allUsers.length > 0) {
      const initialUsers = allUsers.slice(0, 50)
      setDisplayedUsers(initialUsers)
      setHasMoreUsers(allUsers.length > 50)
    }
  }, [allUsers])

  // Search by user email/name or order ID
  const handleSearch = async (value?: string) => {
    setUser(null)
    setOrders([])
    setOrder(null)
    setUserError("")
    setOrderError("")
    const val = (value ?? search).trim()
    if (!val) return

    // Try as order ID first
    const foundOrder = allOrders.find((o: any) => o._id === val)
    if (foundOrder) {
      setOrder(foundOrder)
      // Fetch user for this order
      setSelectedEmail(foundOrder.userEmail)
      return
    }

    // Try as user email or name
    if (val.includes("@")) {
      setSelectedEmail(val)
    } else {
      // If not email, try to find by name
      const found = allUsers.find((u: any) => u.name.toLowerCase() === val.toLowerCase())
      if (found) {
        setSelectedEmail(found.email)
      } else {
        setUserError("User not found")
      }
    }
  }

  // Update user and orders when data changes
  useEffect(() => {
    if (userDetails) {
      setUser(userDetails.userObject)
      setSelectedOrderEmail(userDetails.userObject.email)
    }
  }, [userDetails])

  useEffect(() => {
    if (orderDetails) {
      setOrders(orderDetails)
    }
  }, [orderDetails])

  // Edit user
  const handleEditUserOpen = () => {
    setEditUserForm(user)
    setEditUserOpen(true)
  }

  const handleEditUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditUserForm({ ...editUserForm, [e.target.name]: e.target.value })
  }

  const handleEditUserSubmit = async () => {
    await updateUser({ email: editUserForm.email, data: editUserForm }).unwrap()
    setUser(editUserForm)
    setEditUserOpen(false)
  }

  const handleDeleteUser = async () => {
    await deleteUser(user.email)
    setUser(null)
    setOrders([])
    setOrder(null)
  }

  // Edit order status
  const handleEditOrder = (order: any) => {
    setEditOrderId(order._id)
    setEditOrderStatus(order.status)
    setEditOrderError("")
  }

  const handleEditOrderStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEditOrderStatus(e.target.value)
  }

  const handleEditOrderSubmit = async () => {
    try {
      await updateOrderStatus({
        id: editOrderId!,
        data: { status: editOrderStatus, updatedByEmail: user?.email || "" },
      }).unwrap()
      refetchOrders()
      setEditOrderId(null)
      setEditOrderStatus("")
    } catch (err: any) {
      setEditOrderError("Failed to update order status")
    }
  }

  const handleDeleteOrder = async (id: string) => {
    await deleteOrder(id).unwrap()
    refetchOrders()
  }

  // Details dialog
  const handleDetails = (order: any) => {
    setDetails(order)
    setDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setDetailsOpen(false)
    setDetails(null)
  }

  // Add a helper to search by a given value (for user click)
  const handleSearchWithValue = async (val: string) => {
    await handleSearch(val)
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">User & Order Lookup</h1>
          <p className="dashboard-subtitle">Manage users and orders efficiently</p>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by order ID, user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
              <button className="search-button" onClick={() => handleSearch()} disabled={!search.trim()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
                Search
              </button>
            </div>
          </div>

          {/* Error Messages */}
          {userError && <div className="error-message">{userError}</div>}
          {orderError && <div className="error-message">{orderError}</div>}
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* Users List */}
          {!user && !order && !search && (
            <div className="users-section">
              <div className="section-header">
                <h2 className="section-title">All Users</h2>
                <span className="user-count">
                  {displayedUsers.length} of {allUsers.length} users
                </span>
              </div>
              {loadingUsers ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <div className="users-grid">
                  {displayedUsers.map((u) => (
                    <div key={u._id} className="user-card">
                      <div className="user-info">
                        <h3 className="user-name">{u.name}</h3>
                        <p className="user-email">{u.email}</p>
                      </div>
                      <button
                        className="user-select-btn"
                        onClick={async () => {
                          setSearch(u.email)
                          await handleSearchWithValue(u.email)
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading more indicator */}
              {loadingMoreUsers && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more users...</p>
                </div>
              )}

              {/* End of data indicator */}
              {!hasMoreUsers && displayedUsers.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the user list</p>
                </div>
              )}
            </div>
          )}

          {/* User Details */}
          {user && (
            <div className="user-details-section">
              <div className="section-header">
                <h2 className="section-title">User Details</h2>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={handleEditUserOpen}>
                    Edit User
                  </button>
                  <button className="btn btn-danger" onClick={handleDeleteUser} disabled={deletingUser}>
                    {deletingUser ? "Deleting..." : "Delete User"}
                  </button>
                </div>
              </div>
              <div className="user-details-card">
                <div className="detail-row">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">{user.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{user.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{user.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Address:</span>
                  <span className="detail-value">
                    {user.doorNoAndStreetName}, {user.area}, {user.place}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Orders Section */}
          {user && orders.length > 0 && (
            <div className="orders-section">
              <div className="section-header">
                <h2 className="section-title">User Orders</h2>
                <span className="order-count">{orders.length} orders</span>
              </div>
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">#{order._id.slice(-8)}</div>
                      <div className={`order-status status-${order.status.toLowerCase()}`}>{order.status}</div>
                    </div>
                    <div className="order-meta">
                      <span className="order-date">
                        {order.createdAt && new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="order-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditOrder(order)}>
                        Edit Status
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDetails(order)}>
                        View Details
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteOrder(order._id)}
                        disabled={deletingOrder}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single Order Details */}
          {order && (
            <div className="single-order-section">
              <div className="section-header">
                <h2 className="section-title">Order Details</h2>
                <div className="action-buttons">
                  <button className="btn btn-primary" onClick={() => handleEditOrder(order)}>
                    Edit Status
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteOrder(order._id)}
                    disabled={deletingOrder}
                  >
                    {deletingOrder ? "Deleting..." : "Delete Order"}
                  </button>
                </div>
              </div>
              <div className="order-details-card">
                <div className="detail-row">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">#{order._id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">User Email:</span>
                  <span className="detail-value">{order.userEmail}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-${order.status.toLowerCase()}`}>{order.status}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Created:</span>
                  <span className="detail-value">{order.createdAt && new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit User Modal */}
        {editUserOpen && (
          <div className="modal-overlay" onClick={() => setEditUserOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit User</h2>
                <button className="modal-close" onClick={() => setEditUserOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {editUserForm && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editUserForm.name}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={editUserForm.phone}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={editUserForm.email}
                        disabled
                        className="form-input disabled"
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={editUserForm.password}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Street Address</label>
                      <input
                        type="text"
                        name="doorNoAndStreetName"
                        value={editUserForm.doorNoAndStreetName}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Area</label>
                      <input
                        type="text"
                        name="area"
                        value={editUserForm.area}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Place</label>
                      <input
                        type="text"
                        name="place"
                        value={editUserForm.place}
                        onChange={handleEditUserChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditUserOpen(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditUserSubmit} disabled={updatingUser}>
                  {updatingUser ? "Updating..." : "Update User"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Status Modal */}
        {editOrderId && (
          <div className="modal-overlay" onClick={() => setEditOrderId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Order Status</h2>
                <button className="modal-close" onClick={() => setEditOrderId(null)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {editOrderError && <div className="error-message">{editOrderError}</div>}
                <div className="form-group">
                  <label>Order Status</label>
                  <select value={editOrderStatus} onChange={handleEditOrderStatusChange} className="form-select">
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditOrderId(null)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditOrderSubmit} disabled={updatingOrder}>
                  {updatingOrder ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {detailsOpen && (
          <div className="modal-overlay" onClick={handleDetailsClose}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Order Details</h2>
                <button className="modal-close" onClick={handleDetailsClose}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {details ? (
                  <div className="order-details-full">
                    <div className="details-section">
                      <h3>Order Information</h3>
                      <div className="detail-row">
                        <span className="detail-label">Order ID:</span>
                        <span className="detail-value">#{details._id}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">User Email:</span>
                        <span className="detail-value">{details.userEmail}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className={`detail-value status-${details.status.toLowerCase()}`}>{details.status}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {details.createdAt && new Date(details.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {details.products && details.products.length > 0 && (
                      <div className="details-section">
                        <h3>Products</h3>
                        <div className="products-table">
                          <div className="table-header">
                            <div>Title</div>
                            <div>Type</div>
                            <div>Qty 1</div>
                            <div>Qty 2</div>
                            <div>Count</div>
                          </div>
                          {details.products.map((p: any, idx: number) => (
                            <div key={idx} className="table-row">
                              <div>{p.title}</div>
                              <div>{p.quantityType}</div>
                              <div>{p.quantityOne}</div>
                              <div>{p.quantityTwo}</div>
                              <div>{p.count}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {details.address && (
                      <div className="details-section">
                        <h3>Delivery Address</h3>
                        <div className="address-info">
                          <p>
                            <strong>{details.address.name}</strong>
                          </p>
                          <p>{details.address.phone}</p>
                          <p>
                            {details.address.street}, {details.address.area}
                          </p>
                          {details.address.defaultAddress && <span className="default-badge">Default Address</span>}
                        </div>
                      </div>
                    )}

                    {details.statusHistory && details.statusHistory.length > 0 && (
                      <div className="details-section">
                        <h3>Status History</h3>
                        <div className="status-history">
                          {details.statusHistory.map((h: any, idx: number) => (
                            <div key={idx} className="history-item">
                              <div className="history-status">{h.status}</div>
                              <div className="history-meta">
                                <span>by {h.email}</span>
                                <span>{h.updatedAt && new Date(h.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No details found.</p>
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

export default UserOrderLookupPage
