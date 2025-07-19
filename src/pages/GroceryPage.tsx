"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
// Import from specific API slices
import {
  useGetGroceriesQuery,
  useCreateGroceryMutation,
  useUpdateGroceryMutation,
  useDeleteGroceryMutation,
} from "../store/slices/groceryApi"
import { useUploadProductImageMutation, useDeleteImageMutation } from "../store/slices/uploadApi"
import "../styles/groceryPage.css"

interface Grocery {
  _id?: string
  imageURL: string
  title: string
  description: string
  quantityOne: string
  quantityTwo?: string
}

const defaultGrocery: Grocery = {
  imageURL: "",
  title: "",
  description: "",
  quantityOne: "",
  quantityTwo: "",
}

const GroceryPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Grocery>(defaultGrocery)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalImageURL, setOriginalImageURL] = useState<string | null>(null) // Added state
  const [searchTerm, setSearchTerm] = useState("")
  const [groceryPage, setGroceryPage] = useState(1)
  const [hasMoreGroceries, setHasMoreGroceries] = useState(true)
  const [loadingMoreGroceries, setLoadingMoreGroceries] = useState(false)
  const [displayedGroceries, setDisplayedGroceries] = useState<Grocery[]>([])

  // Grocery API hooks
  const { data: groceries = [], refetch, isLoading } = useGetGroceriesQuery()
  const [createGrocery, { isLoading: creating }] = useCreateGroceryMutation()
  const [updateGrocery, { isLoading: updating }] = useUpdateGroceryMutation()
  const [deleteGrocery, { isLoading: deleting }] = useDeleteGroceryMutation()

  // Upload API hooks
  const [uploadProductImage, { isLoading: uploading }] = useUploadProductImageMutation()
  const [deleteImage, { isLoading: deletingImage }] = useDeleteImageMutation() // Added mutation

  const handleOpen = (grocery?: Grocery) => {
    if (grocery) {
      setEditId(grocery._id!)
      setForm(grocery)
      setImageFile(null)
      setOriginalImageURL(grocery.imageURL || null) // Set original image URL
    } else {
      setEditId(null)
      setForm(defaultGrocery)
      setImageFile(null)
      setOriginalImageURL(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultGrocery)
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
        await updateGrocery({ id: editId, data: submitData }).unwrap()
      } else {
        await createGrocery(submitData).unwrap()
      }
      refetch()
      handleClose()
      setImageFile(null)
    } catch (error: any) {
      console.error("Failed to save grocery item:", error)
      alert(`Failed to save grocery item: ${error.data?.message || error.message || "Unknown error"}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this grocery item?")) {
      const groceryToDelete = groceries.find((g) => g._id === id) // Find the grocery item
      if (groceryToDelete && groceryToDelete.imageURL) {
        const filename = getFilenameFromUrl(groceryToDelete.imageURL)
        if (filename) {
          try {
            await deleteImage(filename).unwrap()
            console.log(`Deleted image: ${filename}`)
          } catch (error) {
            console.error("Failed to delete image during grocery deletion:", error)
            // Continue with grocery deletion even if image deletion fails
          }
        }
      }
      try {
        await deleteGrocery(id).unwrap()
        refetch()
      } catch (error: any) {
        console.error("Failed to delete grocery item:", error)
        alert(`Failed to delete grocery item: ${error.data?.message || error.message || "Unknown error"}`)
      }
    }
  }

  // Load more groceries function with useCallback to prevent stale closures
  const loadMoreGroceries = useCallback(async () => {
    if (loadingMoreGroceries || !hasMoreGroceries) return
    setLoadingMoreGroceries(true)

    // Get all filtered groceries first
    const allFilteredGroceries = groceries.filter(
      (grocery) =>
        grocery.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grocery.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const nextPage = groceryPage + 1
    const startIndex = (nextPage - 1) * 50
    const endIndex = startIndex + 50

    // Get next batch from filtered results
    const nextGroceries = allFilteredGroceries.slice(startIndex, endIndex)

    if (nextGroceries.length === 0 || endIndex >= allFilteredGroceries.length) {
      setHasMoreGroceries(false)
    }

    if (nextGroceries.length > 0) {
      setDisplayedGroceries((prev) => [...prev, ...nextGroceries])
      setGroceryPage(nextPage)
    }
    setLoadingMoreGroceries(false)
  }, [groceries, searchTerm, groceryPage, loadingMoreGroceries, hasMoreGroceries])

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight

    // Check if we're near the bottom (within 200px) and not already loading
    if (scrollTop + clientHeight >= scrollHeight - 200 && !loadingMoreGroceries && hasMoreGroceries) {
      loadMoreGroceries()
    }
  }, [loadMoreGroceries, loadingMoreGroceries, hasMoreGroceries])

  // Add useEffect for infinite scroll with proper dependencies
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const throttledScrollHandler = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(handleScroll, 100) // Throttle to 100ms
    }
    window.addEventListener("scroll", throttledScrollHandler)
    return () => {
      window.removeEventListener("scroll", throttledScrollHandler)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [handleScroll])

  // Initialize and update displayed groceries when search changes
  useEffect(() => {
    const allFilteredGroceries = groceries.filter(
      (grocery) =>
        grocery.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grocery.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const initialGroceries = allFilteredGroceries.slice(0, 50)
    setDisplayedGroceries(initialGroceries)
    setHasMoreGroceries(allFilteredGroceries.length > 50)
    setGroceryPage(1)
  }, [groceries, searchTerm])

  // Scroll to top functionality
  const [showScrollTop, setShowScrollTop] = useState(false)
  useEffect(() => {
    const handleScrollTop = () => {
      setShowScrollTop(window.pageYOffset > 300)
    }
    window.addEventListener("scroll", handleScrollTop)
    return () => window.removeEventListener("scroll", handleScrollTop)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <div className="grocery-management">
      <div className="grocery-container">
        {/* Header */}
        <div className="grocery-header">
          <h1 className="grocery-title">🛒 Grocery Management</h1>
          <p className="grocery-subtitle">Manage your grocery store inventory</p>
        </div>
        {/* Controls Section */}
        <div className="grocery-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search groceries by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
          <button className="btn btn-primary add-grocery-btn" onClick={() => handleOpen()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Grocery
          </button>
        </div>
        {/* Grocery Stats */}
        <div className="grocery-stats">
          <div className="stat-card">
            <div className="stat-number">{displayedGroceries.length}</div>
            <div className="stat-label">Showing Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {
                groceries.filter(
                  (grocery) =>
                    grocery.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    grocery.description.toLowerCase().includes(searchTerm.toLowerCase()),
                ).length
              }
            </div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{groceries.length}</div>
            <div className="stat-label">Total Groceries</div>
          </div>
        </div>
        {/* Grocery List */}
        <div className="grocery-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading grocery items...</p>
            </div>
          ) : displayedGroceries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"></path>
                  <path d="M5 4h14l-1 14H6L5 4z"></path>
                  <path d="M10 9v4"></path>
                  <path d="M14 9v4"></path>
                </svg>
              </div>
              <h3>No groceries found</h3>
              <p>{searchTerm ? "Try adjusting your search terms" : "Get started by adding your first grocery item"}</p>
            </div>
          ) : (
            <>
              <div className="grocery-grid">
                {displayedGroceries.map((grocery) => (
                  <div className="grocery-card" key={grocery._id}>
                    <div className="grocery-image-container">
                      <img
                        src={
                          grocery.imageURL ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMDAgNzBIMjAwVjEzMEgxMDBWNzBaIiBmaWxsPSIjNTU1Ii8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxwYXRoIGQ9Ik0xMTAgMTEwSDE5MFYxMjBIMTEwVjExMFoiIGZpbGw9IiM3NzciLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R3JvY2VyeSBJdGVtPC90ZXh0Pgo8L3N2Zz4=" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={grocery.title}
                        className="grocery-image"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMDAgNzBIMjAwVjEzMEgxMDBWNzBaIiBmaWxsPSIjNTU1Ii8+CjxjaXJjbGUgY3g9IjEyMCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxjaXJjbGUgY3g9IjE0MCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxjaXJjbGUgY3g9IjE2MCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjZmY5ODAwIi8+CjxwYXRoIGQ9Ik0xMTAgMTEwSDE5MFYxMjBIMTEwVjExMFoiIGZpbGw9IiM3NzciLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+R3JvY2VyeSBJdGVtPC90ZXh0Pgo8L3N2Zz4="
                        }}
                      />
                      <div className="grocery-overlay">
                        <button className="action-btn edit-btn" onClick={() => handleOpen(grocery)} title="Edit">
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
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(grocery._id!)}
                          disabled={deleting || deletingImage}
                          title="Delete"
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
                        </button>
                      </div>
                    </div>
                    <div className="grocery-content">
                      <h3 className="grocery-name">{grocery.title}</h3>
                      <p className="grocery-description">{grocery.description}</p>
                      <div className="grocery-quantities">
                        <div className="quantity-item">
                          <span className="quantity-label">Qty 1:</span>
                          <span className="quantity-value">{grocery.quantityOne}</span>
                        </div>
                        {grocery.quantityTwo && (
                          <div className="quantity-item">
                            <span className="quantity-label">Qty 2:</span>
                            <span className="quantity-value">{grocery.quantityTwo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Loading more indicator */}
              {loadingMoreGroceries && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more grocery items...</p>
                </div>
              )}
              {/* End of data indicator */}
              {!hasMoreGroceries && displayedGroceries.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the grocery inventory</p>
                </div>
              )}
            </>
          )}
        </div>
        {/* Add/Edit Modal */}
        {open && (
          <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editId ? "Edit Grocery Item" : "Add New Grocery Item"}</h2>
                <button className="modal-close" onClick={handleClose}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Grocery Image</label>
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
                          id="grocery-image-upload"
                        />
                        <label htmlFor="grocery-image-upload" className="file-upload-btn">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7,10 12,15 17,10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                          </svg>
                          Upload Image
                        </label>
                      </div>
                      {imageFile && (
                        <div className="file-selected">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <polyline points="20,6 9,17 4,12"></polyline>
                          </svg>
                          Selected: {imageFile.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Grocery Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter grocery title"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Enter grocery description"
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
                      placeholder="e.g., 500g, 1 pack"
                      name="quantityOne"
                      value={form.quantityOne}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity 2 (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 1kg, 2 packs"
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
                      {editId ? "Updating..." : "Creating..."}
                    </>
                  ) : editId ? (
                    "Update Grocery"
                  ) : (
                    "Add Grocery"
                  )}
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

export default GroceryPage
