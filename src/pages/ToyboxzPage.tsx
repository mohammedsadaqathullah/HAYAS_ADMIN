"use client"
import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
// Import from specific API slices
import {
  useGetToyboxzQuery,
  useCreateToyboxzMutation,
  useUpdateToyboxzMutation,
  useDeleteToyboxzMutation,
} from "../store/slices/toyboxzApi"
import { useUploadProductImageMutation, useDeleteImageMutation } from "../store/slices/uploadApi" // Added deleteImage
import "../styles/toyBoxzPage.css"

interface Toyboxz {
  _id?: string
  imageURL: string
  title: string
  description: string
  quantityOne: string
  quantityTwo?: string
}

const defaultToyboxz: Toyboxz = {
  imageURL: "",
  title: "",
  description: "",
  quantityOne: "",
  quantityTwo: "",
}

// Base64 encoded SVG placeholder for toys
const TOY_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmQyZDJkIi8+CjxwYXRoIGQ9Ik0xMDAgNTBDMTI3LjYxNCA1MCA1MCA3Ny4zODU4IDUwIDEwNUM1MCAxMzIuNjE0IDc3LjM4NTggMTYwIDEwNSAxNjBIMTAwQzEyNy42MTQgMTYwIDE1NSAxMzIuNjE0IDE1NSAxMDVDMTU1IDc3LjM4NTggMTI3LjYxNCA1MCAxMDAgNTBaIiBmaWxsPSIjNGNhZjUwIi8+CjxjaXJjbGUgY3g9Ijg1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IiMwMDAiLz4KPGNpcmNsZSBjeD0iMTE1IiBjeT0iOTAiIHI9IjUiIGZpbGw9IiMwMDAiLz4KPHBhdGggZD0iTTg1IDExNUMxMDAgMTI1IDExNSAxMTUgMTE1IDExNSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8dGV4dCB4PSIxMDAiIHk9IjE4NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjODg4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Ub3kgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo="

const ToyboxzPage: React.FC = () => {
  // Modal and form states
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Toyboxz>(defaultToyboxz)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalImageURL, setOriginalImageURL] = useState<string | null>(null) // Added state

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [displayedToyboxz, setDisplayedToyboxz] = useState<Toyboxz[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMoreToyboxz, setLoadingMoreToyboxz] = useState(false)
  const [hasMoreToyboxz, setHasMoreToyboxz] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const ITEMS_PER_PAGE = 50

  // API hooks
  const { data: toyboxz = [], refetch, isLoading } = useGetToyboxzQuery()
  const [createToyboxz, { isLoading: creating }] = useCreateToyboxzMutation()
  const [updateToyboxz, { isLoading: updating }] = useUpdateToyboxzMutation()
  const [deleteToyboxz, { isLoading: deleting }] = useDeleteToyboxzMutation()
  const [uploadProductImage, { isLoading: uploading }] = useUploadProductImageMutation()
  const [deleteImage, { isLoading: deletingImage }] = useDeleteImageMutation() // Added mutation

  // Helper function to extract filename from URL
  const getFilenameFromUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname.split("/").pop() || null
    } catch (error) {
      console.error("Invalid URL for filename extraction:", url, error)
      return null
    }
  }

  // Filter toyboxz based on search term
  const filteredToyboxz = toyboxz.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Load more toyboxz function
  const loadMoreToyboxz = useCallback(() => {
    if (isLoadingRef.current || !hasMoreToyboxz) return
    isLoadingRef.current = true
    setLoadingMoreToyboxz(true)

    // Simulate loading delay
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = filteredToyboxz.slice(startIndex, endIndex)

      if (newItems.length > 0) {
        setDisplayedToyboxz((prev) => {
          const existingIds = new Set(prev.map((item) => item._id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id))
          return [...prev, ...uniqueNewItems]
        })
        setCurrentPage((prev) => prev + 1)
      }
      // Check if we've loaded all filtered items
      if (endIndex >= filteredToyboxz.length) {
        setHasMoreToyboxz(false)
      }
      setLoadingMoreToyboxz(false)
      isLoadingRef.current = false
    }, 800)
  }, [currentPage, filteredToyboxz, hasMoreToyboxz])

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
    setHasMoreToyboxz(true)
    setDisplayedToyboxz([])
    isLoadingRef.current = false
    // Load initial items
    if (filteredToyboxz.length > 0) {
      const initialItems = filteredToyboxz.slice(0, ITEMS_PER_PAGE)
      setDisplayedToyboxz(initialItems)
      setCurrentPage(2)
      setHasMoreToyboxz(filteredToyboxz.length > ITEMS_PER_PAGE)
    }
  }, [searchTerm, toyboxz])

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
        !loadingMoreToyboxz &&
        hasMoreToyboxz &&
        !isLoadingRef.current &&
        displayedToyboxz.length < filteredToyboxz.length
      ) {
        loadMoreToyboxz()
      }
    }, 100)
  }, [loadMoreToyboxz, loadingMoreToyboxz, hasMoreToyboxz, displayedToyboxz.length, filteredToyboxz.length])

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
  const handleOpen = (item?: Toyboxz) => {
    if (item) {
      setEditId(item._id!)
      setForm(item)
      setImageFile(null)
      setOriginalImageURL(item.imageURL || null) // Set original image URL
    } else {
      setEditId(null)
      setForm(defaultToyboxz)
      setImageFile(null)
      setOriginalImageURL(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultToyboxz)
    setEditId(null)
    setImageFile(null)
    setOriginalImageURL(null)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    let finalImageURL = form.imageURL // Changed from imageURL to finalImageURL
    let imageUploadSuccess = true

    // Scenario 1: A new image file is selected
    if (imageFile) {
      const formData = new FormData()
      formData.append("uploadImage", imageFile) // Changed from "image" to "uploadImage"
      formData.append("name", form?.title) // Required by your backend's multer setup
      try {
        const res = await uploadProductImage(formData).unwrap()
        finalImageURL = res?.data?.images[0]?.url // Corrected access to nested URL
        // If we are editing and a new image was uploaded, delete the old one
        if (editId && originalImageURL && originalImageURL !== finalImageURL) {
          const oldFilename = getFilenameFromUrl(originalImageURL)
          if (oldFilename) {
            try {
              await deleteImage(oldFilename).unwrap()
              console.log(`Deleted old image during update: ${oldFilename}`)
            } catch (deleteError) {
              console.error("Failed to delete old image during update:", deleteError)
              // Log error but don't block submission
            }
          }
        }
      } catch (error) {
        console.error("Failed to upload new image:", error)
        alert("Failed to upload image. Please try again.")
        imageUploadSuccess = false // Mark upload as failed
        return // Stop submission if new image upload fails
      }
    } else if (editId && originalImageURL && !form.imageURL) {
      // Scenario 2: Editing, no new image file, but original image URL was cleared by user
      const oldFilename = getFilenameFromUrl(originalImageURL)
      if (oldFilename) {
        try {
          await deleteImage(oldFilename).unwrap()
          console.log(`Deleted original image because URL was cleared: ${oldFilename}`)
        } catch (deleteError) {
          console.error("Failed to delete original image when URL cleared:", deleteError)
          // Log error but don't block submission
        }
      }
      finalImageURL = "" // Ensure the URL is empty in the form data
    }

    if (!imageUploadSuccess) return // Don't proceed if image upload failed

    const submitData = { ...form, imageURL: finalImageURL } // Use finalImageURL

    try {
      if (editId) {
        await updateToyboxz({ id: editId, data: submitData }).unwrap()
      } else {
        await createToyboxz(submitData).unwrap()
      }
      refetch()
      handleClose()
      setImageFile(null)
    } catch (error: any) {
      console.error("Failed to save toyboxz item:", error)
      alert(`Failed to save toyboxz item: ${error.data?.message || error.message || "Unknown error"}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this toyboxz item?")) {
      const toyboxzToDelete = toyboxz.find((t) => t._id === id) // Find the toyboxz item
      if (toyboxzToDelete && toyboxzToDelete.imageURL) {
        const filename = getFilenameFromUrl(toyboxzToDelete.imageURL)
        if (filename) {
          try {
            await deleteImage(filename).unwrap()
            console.log(`Deleted image: ${filename}`)
          } catch (error) {
            console.error("Failed to delete image during toyboxz deletion:", error)
            // Continue with toyboxz deletion even if image deletion fails
          }
        }
      }
      try {
        await deleteToyboxz(id).unwrap()
        refetch()
      } catch (error: any) {
        console.error("Failed to delete toyboxz item:", error)
        alert(`Failed to delete toyboxz item: ${error.data?.message || error.message || "Unknown error"}`)
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate stats
  const totalToyboxz = filteredToyboxz.length
  const displayedCount = displayedToyboxz.length

  return (
    <div className="toyboxz-management">
      <div className="toyboxz-container">
        {/* Header */}
        <div className="toyboxz-header">
          <h1 className="toyboxz-title">🧸 Toyboxz Management</h1>
          <p className="toyboxz-subtitle">Manage your toy and entertainment items</p>
        </div>
        {/* Controls */}
        <div className="toyboxz-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search toyboxz..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
            </div>
          </div>
          <button
            className="add-toyboxz-btn btn btn-primary"
            onClick={() => handleOpen()}
            disabled={creating || updating}
          >
            <span>➕</span>
            Add New Toyboxz
          </button>
        </div>
        {/* Stats */}
        <div className="toyboxz-stats">
          <div className="stat-card">
            <div className="stat-number">{totalToyboxz}</div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{displayedCount}</div>
            <div className="stat-label">Showing Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{toyboxz.length}</div>
            <div className="stat-label">Total Toyboxz</div>
          </div>
        </div>
        {/* Main Content */}
        <div className="toyboxz-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading toyboxz...</p>
            </div>
          ) : displayedToyboxz.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🧸</div>
              <h3>No toyboxz found</h3>
              <p>{searchTerm ? "Try adjusting your search terms" : "Get started by adding your first toyboxz item"}</p>
            </div>
          ) : (
            <>
              <div className="toyboxz-grid">
                {displayedToyboxz.map((item) => (
                  <div className="toyboxz-card" key={item._id}>
                    <div className="toyboxz-image-container">
                      <img
                        src={item.imageURL || TOY_PLACEHOLDER}
                        alt={item.title}
                        className="toyboxz-image"
                        onError={(e) => {
                          e.currentTarget.src = TOY_PLACEHOLDER
                        }}
                      />
                      <div className="toyboxz-overlay">
                        <button className="action-btn edit-btn" onClick={() => handleOpen(item)} title="Edit">
                          ✏️
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(item._id!)}
                          disabled={deleting || deletingImage}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="toyboxz-content">
                      <h3 className="toyboxz-name">{item.title}</h3>
                      <p className="toyboxz-description">{item.description}</p>
                      <div className="toyboxz-quantities">
                        <div className="quantity-item">
                          <span className="quantity-label">Quantity 1:</span>
                          <span className="quantity-value">{item.quantityOne}</span>
                        </div>
                        {item.quantityTwo && (
                          <div className="quantity-item">
                            <span className="quantity-label">Quantity 2:</span>
                            <span className="quantity-value">{item.quantityTwo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Loading More Indicator */}
              {loadingMoreToyboxz && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more toyboxz...</p>
                </div>
              )}
              {/* End of Data Indicator */}
              {!hasMoreToyboxz && displayedToyboxz.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the toyboxz list</p>
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
        {open && (
          <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🧸 {editId ? "Edit Toyboxz Item" : "Add New Toyboxz Item"}</h2>
                <button className="modal-close" onClick={handleClose}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Image</label>
                    <div className="image-upload-section">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Image URL"
                        name="imageURL"
                        value={form.imageURL}
                        onChange={handleChange}
                      />
                      <div className="file-upload-wrapper">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="file-input"
                          id="toyboxz-image-upload"
                        />
                        <label htmlFor="toyboxz-image-upload" className="file-upload-btn">
                          📁 Upload Image
                        </label>
                        {imageFile && <div className="file-selected">✅ Selected: {imageFile.name}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Toyboxz title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Toyboxz description"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity 1 *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 1 piece, 1 set"
                      name="quantityOne"
                      value={form.quantityOne}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity 2</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 2 pieces, 2 sets"
                      name="quantityTwo"
                      value={form.quantityTwo}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                {uploading && (
                  <div className="upload-status">
                    <div className="spinner-sm"></div>
                    Uploading image...
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={creating || updating || uploading || deletingImage}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={creating || updating || uploading || deletingImage || !form.title || !form.quantityOne}
                >
                  {creating || updating ? (
                    <>
                      <div className="spinner-sm"></div>
                      Saving...
                    </>
                  ) : (
                    <>💾 {editId ? "Update" : "Add Toyboxz"}</>
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

export default ToyboxzPage
