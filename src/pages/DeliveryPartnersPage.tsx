"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import {
  useGetDeliveryPartnersQuery,
  useRegisterOrUpdateDeliveryPartnerMutation,
  useUpdateDeliveryPartnerStatusMutation,
  useUploadDeliveryPartnerImagesMutation,
} from "../store/slices/deliveryPartnersApi"
import {
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
} from "../store/slices/withdrawalsApi"
import '../styles/deliveryPartners.css'

interface DeliveryPartner {
  _id?: string
  name: string
  parentName: string
  email: string
  phone: string
  address: string
  pincode: string
  profileImage: string
  dlFront: string
  dlBack: string
  aadhaarFront: string
  aadhaarBack: string
  status?: "Pending" | "Approved" | "Rejected"
}

const defaultPartner: DeliveryPartner = {
  name: "",
  parentName: "",
  email: "",
  phone: "",
  address: "",
  pincode: "",
  profileImage: "",
  dlFront: "",
  dlBack: "",
  aadhaarFront: "",
  aadhaarBack: "",
}

// Base64 encoded SVG placeholder for delivery partners
const PARTNER_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmQyZDJkIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iIzRjYWY1MCIvPgo8cGF0aCBkPSJNNjAgMTQwQzYwIDEyMCA4MCA5MCA5MCA5MEMxMDAgOTAgMTIwIDEyMCAxNDAgMTQwSDE2MEMxNjAgMTYwIDEzMCAxODAgMTAwIDE4MEM3MDE4MCA0MCAxNjAgNjAgMTQwWiIgZmlsbD0iIzRjYWY1MCIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QYXJ0bmVyPC90ZXh0Pgo8L3N2Zz4K"

const DeliveryPartnersPage: React.FC = () => {
  // Modal and form states
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<DeliveryPartner>(defaultPartner)
  const [error, setError] = useState("")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [details, setDetails] = useState<DeliveryPartner | null>(null)

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [displayedPartners, setDisplayedPartners] = useState<DeliveryPartner[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMorePartners, setLoadingMorePartners] = useState(false)
  const [hasMorePartners, setHasMorePartners] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("all")

  // Withdrawal states
  const [withdrawalDialog, setWithdrawalDialog] = useState<{
    open: boolean
    withdrawal: any | null
  }>({ open: false, withdrawal: null })
  const [statusUpdate, setStatusUpdate] = useState<{ status: string; remarks: string }>({
    status: "",
    remarks: "",
  })

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const ITEMS_PER_PAGE = 50

  // API hooks
  const { data: partnersData = [], refetch: refetchPartners, isLoading } = useGetDeliveryPartnersQuery()
  const [registerOrUpdateDeliveryPartner, { isLoading: creating }] = useRegisterOrUpdateDeliveryPartnerMutation()
  const [updateDeliveryPartnerStatus, { isLoading: updating }] = useUpdateDeliveryPartnerStatusMutation()
  const [uploadDeliveryPartnerImages, { isLoading: uploading }] = useUploadDeliveryPartnerImagesMutation()
  const [updateWithdrawalStatus] = useUpdateWithdrawalStatusMutation()

  // Filter partners based on search term and active tab
  const filteredPartners = partnersData.filter((partner: DeliveryPartner) => {
    const matchesSearch =
      partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.phone.includes(searchTerm) ||
      partner.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && (!partner.status || partner.status === "Pending")) ||
      (activeTab === "approved" && partner.status === "Approved") ||
      (activeTab === "rejected" && partner.status === "Rejected")

    return matchesSearch && matchesTab
  })

  // Load more partners function
  const loadMorePartners = useCallback(() => {
    if (isLoadingRef.current || !hasMorePartners) return

    isLoadingRef.current = true
    setLoadingMorePartners(true)

    // Simulate loading delay
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = filteredPartners.slice(startIndex, endIndex)

      if (newItems.length > 0) {
        setDisplayedPartners((prev) => {
          const existingIds = new Set(prev.map((item) => item._id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id))
          return [...prev, ...uniqueNewItems]
        })
        setCurrentPage((prev) => prev + 1)
      }

      // Check if we've loaded all filtered items
      if (endIndex >= filteredPartners.length) {
        setHasMorePartners(false)
      }

      setLoadingMorePartners(false)
      isLoadingRef.current = false
    }, 800)
  }, [currentPage, filteredPartners, hasMorePartners])

  // Reset pagination when search or tab changes
  useEffect(() => {
    setCurrentPage(1)
    setHasMorePartners(true)
    setDisplayedPartners([])
    isLoadingRef.current = false

    // Load initial items
    if (filteredPartners.length > 0) {
      const initialItems = filteredPartners.slice(0, ITEMS_PER_PAGE)
      setDisplayedPartners(initialItems)
      setCurrentPage(2)
      setHasMorePartners(filteredPartners.length > ITEMS_PER_PAGE)
    }
  }, [filteredPartners])

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
        !loadingMorePartners &&
        hasMorePartners &&
        !isLoadingRef.current &&
        displayedPartners.length < filteredPartners.length
      ) {
        loadMorePartners()
      }
    }, 100)
  }, [loadMorePartners, loadingMorePartners, hasMorePartners, displayedPartners.length, filteredPartners.length])

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
  const handleOpen = (partner?: DeliveryPartner) => {
    if (partner) {
      setEditId(partner._id!)
      setForm(partner)
    } else {
      setEditId(null)
      setForm(defaultPartner)
    }
    setError("")
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultPartner)
    setEditId(null)
    setError("")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    try {
      await registerOrUpdateDeliveryPartner(form)
      refetchPartners()
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register/update partner")
    }
  }

  const handleStatus = async (email: string, status: string) => {
    await updateDeliveryPartnerStatus({ email, status })
    refetchPartners()
  }

  const handleDetails = (partner: DeliveryPartner) => {
    setDetails(partner)
    setDetailsOpen(true)
  }

  const handleDetailsClose = () => {
    setDetailsOpen(false)
    setDetails(null)
  }

  // Image upload handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]

    // Upload to backend
    const formData = new FormData()
    formData.append("email", form.email)
    formData.append("types", JSON.stringify([type]))
    formData.append("images", file)

    try {
      const res = await uploadDeliveryPartnerImages(formData)
      const url = res.data.images[type]?.url
      setForm((prev) => ({ ...prev, [type]: url }))
    } catch (err) {
      setError("Failed to upload image")
    }
  }

  // Withdrawal handlers
  const handleWithdrawalDialogOpen = (withdrawal: any) => {
    setWithdrawalDialog({ open: true, withdrawal })
    setStatusUpdate({ status: withdrawal.status, remarks: withdrawal.remarks || "" })
  }

  const handleWithdrawalDialogClose = () => {
    setWithdrawalDialog({ open: false, withdrawal: null })
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setStatusUpdate({ ...statusUpdate, [e.target.name]: e.target.value })
  }

  const handleWithdrawalStatusUpdate = async () => {
    if (!withdrawalDialog.withdrawal) return
    await updateWithdrawalStatus({ id: withdrawalDialog.withdrawal._id, data: statusUpdate })
    refetchPartners() // Assuming refetchPartners is the correct refetch for withdrawals
    handleWithdrawalDialogClose()
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate stats
  const totalPartners = partnersData.length
  const pendingCount = partnersData.filter((p: DeliveryPartner) => !p.status || p.status === "Pending").length
  const approvedCount = partnersData.filter((p: DeliveryPartner) => p.status === "Approved").length
  const rejectedCount = partnersData.filter((p: DeliveryPartner) => p.status === "Rejected").length
  const displayedCount = displayedPartners.length

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Approved":
        return "#4caf50"
      case "Rejected":
        return "#f44336"
      case "Pending":
      default:
        return "#ff9800"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "Approved":
        return "✅"
      case "Rejected":
        return "❌"
      case "Pending":
      default:
        return "⚠️"
    }
  }

  return (
    <div className="partners-management">
      <div className="partners-container">
        {/* Header */}
        <div className="partners-header">
          <h1 className="partners-title">🚚 Delivery Partners Management</h1>
          <p className="partners-subtitle">Manage and monitor delivery partners</p>
        </div>

        {/* Controls */}
        <div className="partners-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search by name, email, phone, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
            </div>
          </div>
          <div className="tab-buttons">
            <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              All
            </button>
            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
            </button>
            <button
              className={`tab-btn ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              Approved
            </button>
            <button
              className={`tab-btn ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              Rejected
            </button>
          </div>
          <button className="add-partner-btn btn btn-primary" onClick={() => handleOpen()} disabled={creating}>
            <span>➕</span>
            Add Partner
          </button>
        </div>

        {/* Stats */}
        <div className="partners-stats">
          <div className="stat-card">
            <div className="stat-number">{totalPartners}</div>
            <div className="stat-label">Total Partners</div>
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
        <div className="partners-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading delivery partners...</p>
            </div>
          ) : displayedPartners.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <h3>No delivery partners found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first delivery partner"}
              </p>
            </div>
          ) : (
            <>
              <div className="partners-grid">
                {displayedPartners.map((partner) => (
                  <div className="partner-card" key={partner._id}>
                    <div className="partner-image-container">
                      <img
                        src={partner.profileImage || PARTNER_PLACEHOLDER}
                        alt={partner.name}
                        className="partner-image"
                        onError={(e) => {
                          e.currentTarget.src = PARTNER_PLACEHOLDER
                        }}
                      />
                      <div className="partner-overlay">
                        <button className="action-btn edit-btn" onClick={() => handleOpen(partner)} title="Edit">
                          ✏️
                        </button>
                        <button
                          className="action-btn details-btn"
                          onClick={() => handleDetails(partner)}
                          title="View Details"
                        >
                          👁️
                        </button>
                      </div>
                      <div className="partner-status" style={{ backgroundColor: getStatusColor(partner.status) }}>
                        {getStatusIcon(partner.status)} {partner.status || "Pending"}
                      </div>
                    </div>
                    <div className="partner-content">
                      <h3 className="partner-name">{partner.name}</h3>
                      <p className="partner-email">{partner.email}</p>
                      <div className="partner-info">
                        <div className="info-item">
                          <span className="info-label">Phone:</span>
                          <span className="info-value">{partner.phone}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Pincode:</span>
                          <span className="info-value">{partner.pincode}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Parent:</span>
                          <span className="info-value">{partner.parentName}</span>
                        </div>
                      </div>
                      <div className="partner-actions">
                        <button
                          className="status-btn approve-btn"
                          onClick={() => handleStatus(partner.email, "Approved")}
                          disabled={partner.status === "Approved" || updating}
                          title="Approve"
                        >
                          ✅
                        </button>
                        <button
                          className="status-btn reject-btn"
                          onClick={() => handleStatus(partner.email, "Rejected")}
                          disabled={partner.status === "Rejected" || updating}
                          title="Reject"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMorePartners && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more partners...</p>
                </div>
              )}

              {/* End of Data Indicator */}
              {!hasMorePartners && displayedPartners.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the partners list</p>
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

        {/* Register/Update Modal */}
        {open && (
          <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🚚 {editId ? "Update Partner" : "Register Partner"}</h2>
                <button className="modal-close" onClick={handleClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Full name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Parent Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Parent/Guardian name"
                      name="parentName"
                      value={form.parentName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="Email address"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone *</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="Phone number"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Address *</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Full address"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pincode"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Image Upload Sections */}
                  <div className="form-group full-width">
                    <label>Profile Image</label>
                    <div className="image-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "profileImage")}
                        className="file-input"
                        id="profile-image-upload"
                      />
                      <label htmlFor="profile-image-upload" className="file-upload-btn">
                        📁 Upload Profile Image
                      </label>
                      {form.profileImage && (
                        <div className="image-preview">
                          <img src={form.profileImage || "/placeholder.svg"} alt="Profile" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Driving License Front</label>
                    <div className="image-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "dlFront")}
                        className="file-input"
                        id="dl-front-upload"
                      />
                      <label htmlFor="dl-front-upload" className="file-upload-btn">
                        📁 Upload DL Front
                      </label>
                      {form.dlFront && (
                        <div className="image-preview">
                          <img src={form.dlFront || "/placeholder.svg"} alt="DL Front" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Driving License Back</label>
                    <div className="image-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "dlBack")}
                        className="file-input"
                        id="dl-back-upload"
                      />
                      <label htmlFor="dl-back-upload" className="file-upload-btn">
                        📁 Upload DL Back
                      </label>
                      {form.dlBack && (
                        <div className="image-preview">
                          <img src={form.dlBack || "/placeholder.svg"} alt="DL Back" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Aadhaar Front</label>
                    <div className="image-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "aadhaarFront")}
                        className="file-input"
                        id="aadhaar-front-upload"
                      />
                      <label htmlFor="aadhaar-front-upload" className="file-upload-btn">
                        📁 Upload Aadhaar Front
                      </label>
                      {form.aadhaarFront && (
                        <div className="image-preview">
                          <img src={form.aadhaarFront || "/placeholder.svg"} alt="Aadhaar Front" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Aadhaar Back</label>
                    <div className="image-upload-section">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "aadhaarBack")}
                        className="file-input"
                        id="aadhaar-back-upload"
                      />
                      <label htmlFor="aadhaar-back-upload" className="file-upload-btn">
                        📁 Upload Aadhaar Back
                      </label>
                      {form.aadhaarBack && (
                        <div className="image-preview">
                          <img src={form.aadhaarBack || "/placeholder.svg"} alt="Aadhaar Back" className="preview-image" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {uploading && (
                  <div className="upload-status">
                    <div className="spinner-sm"></div>
                    Uploading images...
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleClose} disabled={creating || uploading}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={creating || uploading || !form.name || !form.email}
                >
                  {creating ? (
                    <>
                      <div className="spinner-sm"></div>
                      Saving...
                    </>
                  ) : (
                    <>💾 {editId ? "Update" : "Register"} Partner</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {detailsOpen && details && (
          <div className="modal-overlay" onClick={handleDetailsClose}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🚚 Partner Details</h2>
                <button className="modal-close" onClick={handleDetailsClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="details-grid">
                  <div className="detail-section">
                    <h3>Personal Information</h3>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{details.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Parent Name:</span>
                      <span className="detail-value">{details.parentName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{details.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{details.phone}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{details.address}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Pincode:</span>
                      <span className="detail-value">{details.pincode}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className="detail-value status" style={{ color: getStatusColor(details.status) }}>
                        {getStatusIcon(details.status)} {details.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="detail-section">
                    <h3>Documents</h3>
                    <div className="documents-grid">
                      {details.profileImage && (
                        <div className="document-item">
                          <span className="document-label">Profile Image</span>
                          <img src={details.profileImage || "/placeholder.svg"} alt="Profile" className="document-image" />
                        </div>
                      )}
                      {details.dlFront && (
                        <div className="document-item">
                          <span className="document-label">DL Front</span>
                          <img src={details.dlFront || "/placeholder.svg"} alt="DL Front" className="document-image" />
                        </div>
                      )}
                      {details.dlBack && (
                        <div className="document-item">
                          <span className="document-label">DL Back</span>
                          <img src={details.dlBack || "/placeholder.svg"} alt="DL Back" className="document-image" />
                        </div>
                      )}
                      {details.aadhaarFront && (
                        <div className="document-item">
                          <span className="document-label">Aadhaar Front</span>
                          <img src={details.aadhaarFront || "/placeholder.svg"} alt="Aadhaar Front" className="document-image" />
                        </div>
                      )}
                      {details.aadhaarBack && (
                        <div className="document-item">
                          <span className="document-label">Aadhaar Back</span>
                          <img src={details.aadhaarBack || "/placeholder.svg"} alt="Aadhaar Back" className="document-image" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleDetailsClose}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Status Update Modal */}
        {withdrawalDialog.open && withdrawalDialog.withdrawal && (
          <div className="modal-overlay" onClick={handleWithdrawalDialogClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>💰 Update Withdrawal Status</h2>
                <button className="modal-close" onClick={handleWithdrawalDialogClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={statusUpdate.status}
                    onChange={handleStatusChange}
                    className="form-select"
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Remarks</label>
                  <textarea
                    name="remarks"
                    placeholder="Add remarks..."
                    value={statusUpdate.remarks}
                    onChange={handleStatusChange}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleWithdrawalDialogClose}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleWithdrawalStatusUpdate}>
                  💾 Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryPartnersPage
