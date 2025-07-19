"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useGetOrdersQuery, useUpdateOrderStatusMutation, useDeleteOrderMutation } from "../services/reduxApi"
import '../styles/orderPage.css'

const statusOptions = ["PENDING", "CANCELLED"]

const OrdersPage: React.FC = () => {
  const [search, setSearch] = useState("")
  const [details, setDetails] = useState<any>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  const [orderPage, setOrderPage] = useState(1)
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  const [loadingMoreOrders, setLoadingMoreOrders] = useState(false)
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([])

  const { data: orders = [], refetch } = useGetOrdersQuery()
  const [updateOrderStatus, { isLoading: updating }] = useUpdateOrderStatusMutation()
  const [deleteOrder, { isLoading: deleting }] = useDeleteOrderMutation()

  const handleDetails = (order: any) => {
    setDetails(order)
    setDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setDetailsOpen(false)
    setDetails(null)
  }

  const handleEdit = (order: any) => {
    setEditId(order._id)
    setStatus(order.status)
    setError("")
  }

  const handleEditClose = () => {
    setEditId(null)
    setStatus("")
    setError("")
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value)
  }

  const handleStatusUpdate = async () => {
    try {
      await updateOrderStatus({
        id: editId!,
        data: { status, updatedByEmail: details?.userEmail || "" },
      }).unwrap()
      refetch()
      handleEditClose()
    } catch (err: any) {
      setError(err.data?.message || "Failed to update status")
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      await deleteOrder(id).unwrap()
      refetch()
    }
  }

  // Add useEffect for infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight ||
        loadingMoreOrders ||
        !hasMoreOrders
      ) {
        return
      }
      loadMoreOrders()
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadingMoreOrders, hasMoreOrders])

  // Load more orders function
  const loadMoreOrders = async () => {
    if (loadingMoreOrders || !hasMoreOrders) return

    setLoadingMoreOrders(true)
    const nextPage = orderPage + 1
    const startIndex = (nextPage - 1) * 50
    const endIndex = startIndex + 50

    // Get next batch of filtered orders
    const allFilteredOrders = orders.filter(
      (order) =>
        order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        order._id?.toLowerCase().includes(search.toLowerCase()) ||
        (order.status || "").toLowerCase().includes(search.toLowerCase()),
    )

    const nextOrders = allFilteredOrders.slice(startIndex, endIndex)

    if (nextOrders.length === 0) {
      setHasMoreOrders(false)
    } else {
      setDisplayedOrders((prev) => [...prev, ...nextOrders])
      setOrderPage(nextPage)
    }

    setLoadingMoreOrders(false)
  }

  // Initialize and update displayed orders when search changes
  useEffect(() => {
    const allFilteredOrders = orders.filter(
      (order) =>
        order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
        order._id?.toLowerCase().includes(search.toLowerCase()) ||
        (order.status || "").toLowerCase().includes(search.toLowerCase()),
    )

    const initialOrders = allFilteredOrders.slice(0, 50)
    setDisplayedOrders(initialOrders)
    setHasMoreOrders(allFilteredOrders.length > 50)
    setOrderPage(1)
  }, [orders, search])

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "status-pending"
      case "cancelled":
        return "status-cancelled"
      default:
        return "status-default"
    }
  }

  return (
    <div className="orders-management">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1 className="orders-title">Orders Management</h1>
          <p className="orders-subtitle">Track and manage customer orders</p>
        </div>

        {/* Search Section */}
        <div className="orders-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by user email, order ID, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Stats */}
        <div className="orders-stats">
          <div className="stat-card">
            <div className="stat-number">{displayedOrders.length}</div>
            <div className="stat-label">Showing Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {
                orders.filter(
                  (order) =>
                    order.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
                    order._id?.toLowerCase().includes(search.toLowerCase()) ||
                    (order.status || "").toLowerCase().includes(search.toLowerCase()),
                ).length
              }
            </div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{orders.filter((order) => order.status === "PENDING").length}</div>
            <div className="stat-label">Pending Orders</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{orders.filter((order) => order.status === "CANCELLED").length}</div>
            <div className="stat-label">Cancelled Orders</div>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list-section">
          {displayedOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M9 11H5a2 2 0 0 0-2 2v3c0 1.1.9 2 2 2h4m6-6h4a2 2 0 0 1 2 2v3c0 1.1-.9 2-2 2h-4m-6 0V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"></path>
                </svg>
              </div>
              <h3>No orders found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <>
              <div className="orders-grid">
                {displayedOrders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <div className="order-id">#{order._id.slice(-8)}</div>
                      <div className={`order-status ${getStatusColor(order.status)}`}>{order.status}</div>
                    </div>
                    <div className="order-info">
                      <div className="order-detail">
                        <span className="detail-label">User:</span>
                        <span className="detail-value">{order.userEmail}</span>
                      </div>
                      <div className="order-detail">
                        <span className="detail-label">Created:</span>
                        <span className="detail-value">
                          {order.createdAt && new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {order.products && (
                        <div className="order-detail">
                          <span className="detail-label">Items:</span>
                          <span className="detail-value">{order.products.length} products</span>
                        </div>
                      )}
                    </div>
                    <div className="order-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => handleEdit(order)}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit Status
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDetails(order)}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(order._id)}
                        disabled={deleting}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3,6 5,6 21,6"></polyline>
                          <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                        </svg>
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading more indicator */}
              {loadingMoreOrders && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more orders...</p>
                </div>
              )}

              {/* End of data indicator */}
              {!hasMoreOrders && displayedOrders.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the orders list</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Status Modal */}
        {editId && (
          <div className="modal-overlay" onClick={handleEditClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Order Status</h2>
                <button className="modal-close" onClick={handleEditClose}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-group">
                  <label>Order Status</label>
                  <select value={status} onChange={handleStatusChange} className="form-select">
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleEditClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating}>
                  {updating ? (
                    <>
                      <div className="spinner-sm"></div>
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
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
                        <span className={`detail-value ${getStatusColor(details.status)}`}>{details.status}</span>
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
                              <div className={`history-status ${getStatusColor(h.status)}`}>{h.status}</div>
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
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading order details...</p>
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

        {/* Scroll to top button */}
        {showScrollTop && (
          <button className={`scroll-to-top ${showScrollTop ? "visible" : ""}`} onClick={scrollToTop}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="18,15 12,9 6,15"></polyline>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export default OrdersPage
