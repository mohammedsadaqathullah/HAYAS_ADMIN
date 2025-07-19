"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useGetAllWithdrawalsQuery, useUpdateWithdrawalStatusMutation } from "../services/reduxApi"
import '../styles/withdrawals.css'

interface Withdrawal {
  _id: string
  amount: number
  email: string
  status: "Pending" | "Approved" | "Rejected"
  requestedAt: string
  processedAt?: string
  orderDetails?: Array<{
    orderId: { _id: string }
    orderDate: string
    earnings: number
  }>
  remarks?: string
}

const WithdrawalsPage: React.FC = () => {
  // Modal and form states
  const [withdrawalDialog, setWithdrawalDialog] = useState<{
    open: boolean
    withdrawal: Withdrawal | null
  }>({ open: false, withdrawal: null })
  const [statusUpdate, setStatusUpdate] = useState<{ status: string; remarks: string }>({
    status: "",
    remarks: "",
  })

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [displayedWithdrawals, setDisplayedWithdrawals] = useState<Withdrawal[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMoreWithdrawals, setLoadingMoreWithdrawals] = useState(false)
  const [hasMoreWithdrawals, setHasMoreWithdrawals] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "processed">("all")

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const ITEMS_PER_PAGE = 50

  // API hooks
  const { data: withdrawals = [], isLoading, error, refetch } = useGetAllWithdrawalsQuery(undefined)
  const [updateWithdrawalStatus, { isLoading: updating }] = useUpdateWithdrawalStatusMutation()

  // Filter withdrawals based on search term and active tab
  const filteredWithdrawals = withdrawals.filter((withdrawal: Withdrawal) => {
    const matchesSearch =
      withdrawal.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.amount.toString().includes(searchTerm) ||
      withdrawal.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (withdrawal.remarks && withdrawal.remarks.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && withdrawal.status === "Pending") ||
      (activeTab === "processed" && withdrawal.status !== "Pending")

    return matchesSearch && matchesTab
  })

  // Load more withdrawals function
  const loadMoreWithdrawals = useCallback(() => {
    if (isLoadingRef.current || !hasMoreWithdrawals) return

    isLoadingRef.current = true
    setLoadingMoreWithdrawals(true)

    // Simulate loading delay
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = filteredWithdrawals.slice(startIndex, endIndex)

      if (newItems.length > 0) {
        setDisplayedWithdrawals((prev) => {
          const existingIds = new Set(prev.map((item) => item._id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id))
          return [...prev, ...uniqueNewItems]
        })
        setCurrentPage((prev) => prev + 1)
      }

      // Check if we've loaded all filtered items
      if (endIndex >= filteredWithdrawals.length) {
        setHasMoreWithdrawals(false)
      }

      setLoadingMoreWithdrawals(false)
      isLoadingRef.current = false
    }, 800)
  }, [currentPage, filteredWithdrawals, hasMoreWithdrawals])

  // Reset pagination when search or tab changes
  useEffect(() => {
    setCurrentPage(1)
    setHasMoreWithdrawals(true)
    setDisplayedWithdrawals([])
    isLoadingRef.current = false

    // Load initial items
    if (filteredWithdrawals.length > 0) {
      const initialItems = filteredWithdrawals.slice(0, ITEMS_PER_PAGE)
      setDisplayedWithdrawals(initialItems)
      setCurrentPage(2)
      setHasMoreWithdrawals(filteredWithdrawals.length > ITEMS_PER_PAGE)
    }
  }, [searchTerm, activeTab, withdrawals])

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
        !loadingMoreWithdrawals &&
        hasMoreWithdrawals &&
        !isLoadingRef.current &&
        displayedWithdrawals.length < filteredWithdrawals.length
      ) {
        loadMoreWithdrawals()
      }
    }, 100)
  }, [loadMoreWithdrawals, loadingMoreWithdrawals, hasMoreWithdrawals, displayedWithdrawals.length, filteredWithdrawals.length])

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
  const handleWithdrawalDialogOpen = (withdrawal: Withdrawal) => {
    setWithdrawalDialog({ open: true, withdrawal })
    setStatusUpdate({ status: withdrawal.status, remarks: withdrawal.remarks || "" })
  }

  const handleWithdrawalDialogClose = () => {
    setWithdrawalDialog({ open: false, withdrawal: null })
  }

  const handleStatusChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setStatusUpdate({ ...statusUpdate, [e.target.name]: e.target.value })
  }

  const handleWithdrawalStatusUpdate = async () => {
    if (!withdrawalDialog.withdrawal) return
    await updateWithdrawalStatus({
      id: withdrawalDialog.withdrawal._id,
      data: statusUpdate,
    }).unwrap()
    refetch()
    handleWithdrawalDialogClose()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate stats
  const totalWithdrawals = withdrawals.length
  const pendingCount = withdrawals.filter((w: Withdrawal) => w.status === "Pending").length
  const approvedCount = withdrawals.filter((w: Withdrawal) => w.status === "Approved").length
  const rejectedCount = withdrawals.filter((w: Withdrawal) => w.status === "Rejected").length
  const displayedCount = displayedWithdrawals.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#ff9800"
      case "Approved":
        return "#4caf50"
      case "Rejected":
        return "#f44336"
      default:
        return "#666"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  return (
    <div className="withdrawals-management">
      <div className="withdrawals-container">
        {/* Header */}
        <div className="withdrawals-header">
          <h1 className="withdrawals-title">💰 Withdrawal Requests Management</h1>
          <p className="withdrawals-subtitle">Manage and process withdrawal requests</p>
        </div>

        {/* Controls */}
        <div className="withdrawals-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by email, amount, status, or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
            </div>
          </div>
          <div className="tab-buttons">
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </button>
            <button
              className={`tab-btn ${activeTab === "processed" ? "active" : ""}`}
              onClick={() => setActiveTab("processed")}
            >
              Processed
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="withdrawals-stats">
          <div className="stat-card">
            <div className="stat-number">{totalWithdrawals}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card pending">
            <div className="stat-number">{pendingCount}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card approved">
            <div className="stat-number">{approvedCount}</div>
            <div className="stat-label">Approved</div>
          </div>
          <div className="stat-card rejected">
            <div className="stat-number">{rejectedCount}</div>
            <div className="stat-label">Rejected</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{displayedCount}</div>
            <div className="stat-label">Showing</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="withdrawals-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading withdrawal requests...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <div className="error-icon">❌</div>
              <h3>Failed to load withdrawals</h3>
              <p>Please try refreshing the page</p>
            </div>
          ) : displayedWithdrawals.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💰</div>
              <h3>No withdrawal requests found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "No withdrawal requests available at the moment"}
              </p>
            </div>
          ) : (
            <>
              <div className="withdrawals-grid">
                {displayedWithdrawals.map((withdrawal) => (
                  <div className="withdrawal-card" key={withdrawal._id}>
                    <div className="withdrawal-header">
                      <div className="withdrawal-amount">{formatCurrency(withdrawal.amount)}</div>
                      <div
                        className="withdrawal-status"
                        style={{ backgroundColor: getStatusColor(withdrawal.status) }}
                      >
                        {withdrawal.status}
                      </div>
                    </div>
                    <div className="withdrawal-content">
                      <div className="withdrawal-info">
                        <div className="info-item">
                          <span className="info-label">Partner Email:</span>
                          <span className="info-value">{withdrawal.email}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Requested:</span>
                          <span className="info-value">
                            {new Date(withdrawal.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {withdrawal.processedAt && (
                          <div className="info-item">
                            <span className="info-label">Processed:</span>
                            <span className="info-value">
                              {new Date(withdrawal.processedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="info-item">
                          <span className="info-label">Orders:</span>
                          <span className="info-value">{withdrawal.orderDetails?.length || 0}</span>
                        </div>
                        {withdrawal.remarks && (
                          <div className="info-item">
                            <span className="info-label">Remarks:</span>
                            <span className="info-value">{withdrawal.remarks}</span>
                          </div>
                        )}
                      </div>
                      <div className="withdrawal-actions">
                        <button
                          className="action-btn manage-btn"
                          onClick={() => handleWithdrawalDialogOpen(withdrawal)}
                        >
                          {withdrawal.status === "Pending" ? "Manage" : "View Details"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMoreWithdrawals && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more withdrawals...</p>
                </div>
              )}

              {/* End of Data Indicator */}
              {!hasMoreWithdrawals && displayedWithdrawals.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the withdrawals list</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button className="scroll-to-top" onClick={scrollToTop}>
            ⬆️
          </button>
        )}

        {/* Modal Dialog */}
        {withdrawalDialog.open && withdrawalDialog.withdrawal && (
          <div className="modal-overlay" onClick={handleWithdrawalDialogClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💰 Manage Withdrawal Request</h2>
                <button className="modal-close" onClick={handleWithdrawalDialogClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="withdrawal-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Partner Email:</span>
                      <span className="detail-value">{withdrawalDialog.withdrawal.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount:</span>
                      <span className="detail-value amount">
                        {formatCurrency(withdrawalDialog.withdrawal.amount)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span
                        className="detail-value status"
                        style={{ color: getStatusColor(withdrawalDialog.withdrawal.status) }}
                      >
                        {withdrawalDialog.withdrawal.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Requested At:</span>
                      <span className="detail-value">
                        {new Date(withdrawalDialog.withdrawal.requestedAt).toLocaleString()}
                      </span>
                    </div>
                    {withdrawalDialog.withdrawal.processedAt && (
                      <div className="detail-item">
                        <span className="detail-label">Processed At:</span>
                        <span className="detail-value">
                          {new Date(withdrawalDialog.withdrawal.processedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Order Count:</span>
                      <span className="detail-value">
                        {withdrawalDialog.withdrawal.orderDetails?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Order Details */}
                  {withdrawalDialog.withdrawal.orderDetails &&
                    withdrawalDialog.withdrawal.orderDetails.length > 0 && (
                      <div className="order-details-section">
                        <h3>Order Details</h3>
                        <div className="order-details-grid">
                          {withdrawalDialog.withdrawal.orderDetails.map((order, idx) => (
                            <div key={idx} className="order-detail-card">
                              <div className="order-id">Order: {order.orderId._id}</div>
                              <div className="order-date">
                                Date: {new Date(order.orderDate).toLocaleDateString()}
                              </div>
                              <div className="order-earnings">
                                Earnings: {formatCurrency(order.earnings)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Status Update Form */}
                  <div className="form-section">
                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        value={statusUpdate.status}
                        onChange={handleStatusChange}
                        disabled={withdrawalDialog.withdrawal.status !== "Pending"}
                        className="form-select"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="remarks">Remarks</label>
                      <textarea
                        id="remarks"
                        name="remarks"
                        value={statusUpdate.remarks}
                        onChange={handleStatusChange}
                        rows={3}
                        className="form-textarea"
                        placeholder="Add remarks or notes..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleWithdrawalDialogClose}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleWithdrawalStatusUpdate}
                  disabled={withdrawalDialog.withdrawal.status !== "Pending" || updating}
                >
                  {updating ? (
                    <>
                      <div className="spinner-sm"></div>
                      Updating...
                    </>
                  ) : (
                    <>💾 Update Status</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawalsPage
