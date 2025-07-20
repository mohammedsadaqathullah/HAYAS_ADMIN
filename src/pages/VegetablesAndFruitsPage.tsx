"use client"
import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
// Import from specific API slices
import {
  useGetVegFruitsQuery,
  useCreateVegFruitMutation,
  useUpdateVegFruitMutation,
  useDeleteVegFruitMutation,
} from "../store/slices/vegFruitsApi"
import { useUploadProductImageMutation, useDeleteImageMutation } from "../store/slices/uploadApi" // Added deleteImage
import "../styles/vegetables&fruits.css"

interface VegFruit {
  _id?: string
  imageURL: string
  title: string
  description: string
  quantityOne: string
  quantityTwo?: string
}

const defaultVegFruit: VegFruit = {
  imageURL: "",
  title: "",
  description: "",
  quantityOne: "",
  quantityTwo: "",
}

// Base64 encoded SVG placeholder for vegetables/fruits
const VEGFRUIT_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMmQyZDJkIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM0Y2FmNTAiLz4KPGVsbGlwc2UgY3g9IjEwMCIgY3k9IjgwIiByeD0iMjAiIHJ5PSIzMCIgZmlsbD0iIzY2YmI2YSIvPgo8cGF0aCBkPSJNMTAwIDUwQzEwNSA0NSAxMTAgNTAgMTEwIDYwQzExMCA3MCA5MCA3MCA5MCA2MEM5MCA1MCA5NSA0NSAxMDAgNTBaIiBmaWxsPSIjMmU3ZDMyIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTg1IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM4ODgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlZlZyBJbWFnZTwvdGV4dD4KPC9zdmc+Cg=="

const VegetablesAndFruitsPage: React.FC = () => {
  // Modal and form states
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<VegFruit>(defaultVegFruit)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalImageURL, setOriginalImageURL] = useState<string | null>(null) // Added state

  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("")
  const [displayedItems, setDisplayedItems] = useState<VegFruit[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loadingMoreItems, setLoadingMoreItems] = useState(false)
  const [hasMoreItems, setHasMoreItems] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Refs
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isLoadingRef = useRef(false)
  const ITEMS_PER_PAGE = 50

  // API hooks
  const { data: items = [], refetch, isLoading } = useGetVegFruitsQuery()
  const [createVegFruit, { isLoading: creating }] = useCreateVegFruitMutation()
  const [updateVegFruit, { isLoading: updating }] = useUpdateVegFruitMutation()
  const [deleteVegFruit, { isLoading: deleting }] = useDeleteVegFruitMutation()
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

  // Filter items based on search term
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Load more items function
  const loadMoreItems = useCallback(() => {
    if (isLoadingRef.current || !hasMoreItems) return
    isLoadingRef.current = true
    setLoadingMoreItems(true)

    // Simulate loading delay
    setTimeout(() => {
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
      const endIndex = startIndex + ITEMS_PER_PAGE
      const newItems = filteredItems.slice(startIndex, endIndex)

      if (newItems.length > 0) {
        setDisplayedItems((prev) => {
          const existingIds = new Set(prev.map((item) => item._id))
          const uniqueNewItems = newItems.filter((item) => !existingIds.has(item._id))
          return [...prev, ...uniqueNewItems]
        })
        setCurrentPage((prev) => prev + 1)
      }
      // Check if we've loaded all filtered items
      if (endIndex >= filteredItems.length) {
        setHasMoreItems(false)
      }
      setLoadingMoreItems(false)
      isLoadingRef.current = false
    }, 800)
  }, [currentPage, filteredItems, hasMoreItems])

  // Reset pagination when search changes
  useEffect(() => {
    setCurrentPage(1)
    setHasMoreItems(true)
    setDisplayedItems([])
    isLoadingRef.current = false
    // Load initial items
    if (filteredItems.length > 0) {
      const initialItems = filteredItems.slice(0, ITEMS_PER_PAGE)
      setDisplayedItems(initialItems)
      setCurrentPage(2)
      setHasMoreItems(filteredItems.length > ITEMS_PER_PAGE)
    }
  }, [filteredItems])

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
        !loadingMoreItems &&
        hasMoreItems &&
        !isLoadingRef.current &&
        displayedItems.length < filteredItems.length
      ) {
        loadMoreItems()
      }
    }, 100)
  }, [loadMoreItems, loadingMoreItems, hasMoreItems, displayedItems.length, filteredItems.length])

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
  const handleOpen = (item?: VegFruit) => {
    if (item) {
      setEditId(item._id!)
      setForm(item)
      setImageFile(null)
      setOriginalImageURL(item.imageURL || null) // Set original image URL
    } else {
      setEditId(null)
      setForm(defaultVegFruit)
      setImageFile(null)
      setOriginalImageURL(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultVegFruit)
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
        await updateVegFruit({ id: editId, data: submitData }).unwrap()
      } else {
        await createVegFruit(submitData).unwrap()
      }
      refetch()
      handleClose()
      setImageFile(null)
    } catch (error: any) {
      console.error("Failed to save item:", error)
      alert(`Failed to save item: ${error.data?.message || error.message || "Unknown error"}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      const itemToDelete = items.find((i) => i._id === id) // Find the item
      if (itemToDelete && itemToDelete.imageURL) {
        const filename = getFilenameFromUrl(itemToDelete.imageURL)
        if (filename) {
          try {
            await deleteImage(filename).unwrap()
            console.log(`Deleted image: ${filename}`)
          } catch (error) {
            console.error("Failed to delete image during item deletion:", error)
            // Continue with item deletion even if image deletion fails
          }
        }
      }
      try {
        await deleteVegFruit(id).unwrap()
        refetch()
      } catch (error: any) {
        console.error("Failed to delete item:", error)
        alert(`Failed to delete item: ${error.data?.message || error.message || "Unknown error"}`)
      }
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Calculate stats
  const totalItems = filteredItems.length
  const displayedCount = displayedItems.length

  return (
    <div className="vegfruit-management">
      <div className="vegfruit-container">
        {/* Header */}
        <div className="vegfruit-header">
          <h1 className="vegfruit-title">🥬 Vegetables & Fruits Management</h1>
          <p className="vegfruit-subtitle">Manage your fresh produce items</p>
        </div>
        {/* Controls */}
        <div className="vegfruit-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search vegetables & fruits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="search-icon">🔍</i>
            </div>
          </div>
          <button
            className="add-vegfruit-btn btn btn-primary"
            onClick={() => handleOpen()}
            disabled={creating || updating}
          >
            <span>➕</span>
            Add New Item
          </button>
        </div>
        {/* Stats */}
        <div className="vegfruit-stats">
          <div className="stat-card">
            <div className="stat-number">{totalItems}</div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{displayedCount}</div>
            <div className="stat-label">Showing Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{items.length}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>
        {/* Main Content */}
        <div className="vegfruit-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading vegetables & fruits...</p>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🥬</div>
              <h3>No items found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first vegetable or fruit item"}
              </p>
            </div>
          ) : (
            <>
              <div className="vegfruit-grid">
                {displayedItems.map((item) => (
                  <div className="vegfruit-card" key={item._id}>
                    <div className="vegfruit-image-container">
                      <img
                        src={item.imageURL || VEGFRUIT_PLACEHOLDER}
                        alt={item.title}
                        className="vegfruit-image"
                        onError={(e) => {
                          e.currentTarget.src = VEGFRUIT_PLACEHOLDER
                        }}
                      />
                      <div className="vegfruit-overlay">
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
                    <div className="vegfruit-content">
                      <h3 className="vegfruit-name">{item.title}</h3>
                      <p className="vegfruit-description">{item.description}</p>
                      <div className="vegfruit-quantities">
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
              {loadingMoreItems && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more items...</p>
                </div>
              )}
              {/* End of Data Indicator */}
              {!hasMoreItems && displayedItems.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the items list</p>
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
                <h2>🥬 {editId ? "Edit Item" : "Add New Item"}</h2>
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
                          id="vegfruit-image-upload"
                        />
                        <label htmlFor="vegfruit-image-upload" className="file-upload-btn">
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
                      placeholder="Item title"
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
                      placeholder="Item description"
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
                      placeholder="e.g., 1kg, 500g"
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
                      placeholder="e.g., 2kg, 1kg"
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
                    <>💾 {editId ? "Update" : "Add Item"}</>
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

export default VegetablesAndFruitsPage
