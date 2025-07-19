"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
// Import from foodApi for food-related operations
import {
  useGetFoodsQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} from "../store/slices/foodApi"
// Import from uploadApi for image-related operations
import { useUploadProductImageMutation, useDeleteImageMutation } from "../store/slices/uploadApi"
import "../styles/foodPage.css"

interface Food {
  _id?: string
  imageURL: string
  title: string
  description: string
  quantityOne: string
  quantityTwo?: string
}

const defaultFood: Food = {
  imageURL: "",
  title: "",
  description: "",
  quantityOne: "",
  quantityTwo: "",
}

const FoodPage: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<Food>(defaultFood)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [originalImageURL, setOriginalImageURL] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [foodPage, setFoodPage] = useState(1)
  const [hasMoreFoods, setHasMoreFoods] = useState(true)
  const [loadingMoreFoods, setLoadingMoreFoods] = useState(false)
  const [displayedFoods, setDisplayedFoods] = useState<Food[]>([])

  // Food API hooks
  const { data: foods = [], refetch, isLoading } = useGetFoodsQuery()
  const [createFood, { isLoading: creating }] = useCreateFoodMutation()
  const [updateFood, { isLoading: updating }] = useUpdateFoodMutation()
  const [deleteFood, { isLoading: deleting }] = useDeleteFoodMutation()

  // Upload API hooks
  const [uploadProductImage, { isLoading: uploading }] = useUploadProductImageMutation()
  const [deleteImage, { isLoading: deletingImage }] = useDeleteImageMutation()

  const handleOpen = (food?: Food) => {
    if (food) {
      setEditId(food._id!)
      setForm(food)
      setImageFile(null)
      setOriginalImageURL(food.imageURL || null)
    } else {
      setEditId(null)
      setForm(defaultFood)
      setImageFile(null)
      setOriginalImageURL(null)
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setForm(defaultFood)
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
    let finalImageURL = form.imageURL
    let imageUploadSuccess = true

    // Scenario 1: A new image file is selected
    if (imageFile) {
      const formData = new FormData()
      formData.append("uploadImage", imageFile)
      formData.append("name", form?.title) // Using form.title as the name for the image group
      try {
        const res = await uploadProductImage(formData).unwrap()
        finalImageURL = res?.data?.images[0]?.url // CORRECTED: Accessing the URL from the nested structure
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

    const submitData = { ...form, imageURL: finalImageURL }

    try {
      if (editId) {
        await updateFood({ id: editId, data: submitData }).unwrap()
      } else {
        await createFood(submitData).unwrap()
      }
      refetch()
      handleClose()
      setImageFile(null)
    } catch (error: any) {
      console.error("Failed to save food item:", error)
      alert(`Failed to save food item: ${error.data?.message || error.message || "Unknown error"}`)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      const foodToDelete = foods.find((f) => f._id === id)
      if (foodToDelete && foodToDelete.imageURL) {
        const filename = getFilenameFromUrl(foodToDelete.imageURL)
        if (filename) {
          try {
            await deleteImage(filename).unwrap()
            console.log(`Deleted image: ${filename}`)
          } catch (error) {
            console.error("Failed to delete image during food deletion:", error)
            // Continue with food deletion even if image deletion fails
          }
        }
      }
      try {
        await deleteFood(id).unwrap()
        refetch()
      } catch (error: any) {
        console.error("Failed to delete food item:", error)
        alert(`Failed to delete food item: ${error.data?.message || error.message || "Unknown error"}`)
      }
    }
  }

  // Load more foods function with useCallback to prevent stale closures
  const loadMoreFoods = useCallback(async () => {
    if (loadingMoreFoods || !hasMoreFoods) return
    setLoadingMoreFoods(true)

    // Get all filtered foods first
    const allFilteredFoods = foods.filter(
      (food) =>
        food.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    const nextPage = foodPage + 1
    const startIndex = (nextPage - 1) * 50
    const endIndex = startIndex + 50

    // Get next batch from filtered results
    const nextFoods = allFilteredFoods.slice(startIndex, endIndex)

    if (nextFoods.length === 0 || endIndex >= allFilteredFoods.length) {
      setHasMoreFoods(false)
    }

    if (nextFoods.length > 0) {
      setDisplayedFoods((prev) => [...prev, ...nextFoods])
      setFoodPage(nextPage)
    }
    setLoadingMoreFoods(false)
  }, [foods, searchTerm, foodPage, loadingMoreFoods, hasMoreFoods])

  // Throttled scroll handler
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = document.documentElement.clientHeight

    // Check if we're near the bottom (within 200px) and not already loading
    if (scrollTop + clientHeight >= scrollHeight - 200 && !loadingMoreFoods && hasMoreFoods) {
      loadMoreFoods()
    }
  }, [loadMoreFoods, loadingMoreFoods, hasMoreFoods])

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

  // Initialize and update displayed foods when search changes
  useEffect(() => {
    const allFilteredFoods = foods.filter(
      (food) =>
        food.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    const initialFoods = allFilteredFoods.slice(0, 50)
    setDisplayedFoods(initialFoods)
    setHasMoreFoods(allFilteredFoods.length > 50)
    setFoodPage(1)
  }, [foods, searchTerm])

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
    <div className="food-management">
      <div className="food-container">
        {/* Header */}
        <div className="food-header">
          <h1 className="food-title">🍽️ Food Management</h1>
          <p className="food-subtitle">Manage your delicious menu items</p>
        </div>
        {/* Controls Section */}
        <div className="food-controls">
          <div className="search-container">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Search foods by name or description..."
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
          <button className="btn btn-primary add-food-btn" onClick={() => handleOpen()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Food
          </button>
        </div>
        {/* Food Stats */}
        <div className="food-stats">
          <div className="stat-card">
            <div className="stat-number">{displayedFoods.length}</div>
            <div className="stat-label">Showing Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {
                foods.filter(
                  (food) =>
                    food.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    food.description.toLowerCase().includes(searchTerm.toLowerCase()),
                ).length
              }
            </div>
            <div className="stat-label">Total Results</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{foods.length}</div>
            <div className="stat-label">Total Foods</div>
          </div>
        </div>
        {/* Food List */}
        <div className="food-list-section">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading delicious foods...</p>
            </div>
          ) : displayedFoods.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
              </div>
              <h3>No foods found</h3>
              <p>{searchTerm ? "Try adjusting your search terms" : "Get started by adding your first food item"}</p>
            </div>
          ) : (
            <>
              <div className="food-grid">
                {displayedFoods.map((food) => (
                  <div key={food._id} className="food-card">
                    <div className="food-image-container">
                      <img
                        src={
                          food.imageURL ||
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik0xMjAgODBIMTgwVjEyMEgxMjBWODBaIiBmaWxsPSIjNTU1Ii8+CjxjaXJjbGUgY3g9IjEzNSIgY3k9IjkwIiByPSI1IiBmaWxsPSIjNzc3Ii8+CjxwYXRoIGQ9Ik0xMjUgMTEwTDE0NSAxMDBMMTY1IDExMEwxNTUgMTIwTDEzNSAxMjBMMTI1IDExMFoiIGZpbGw9IiM3NzciLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Rm9vZCBJbWFnZTwvdGV4dD4KPC9zdmc+" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt={food.title}
                        className="food-image"
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0dGg9IjMwMCIgaGVpZ2h0PSIyMDAiIHZpZXdCb3g9IjAgMCAzMDAgMjAwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPgo8cGF0aCBkPSJNMTIwIDgwSDE4MFYxMjBIMTIwVjgwWiIgZmlsbD0iIzU1NSIvPgo8Y2lyY2xlIGN4PSIxMzUiIGN5PSI5MCIgcj0iNSIgZmlsbD0iIzc3NyIvPgo8cGF0aCBkPSJNMTI1IDExMEwxNDUgMTAwTDE2NSAxMTBMMTU1IDEyMEwxMzUgMTIwTDEyNSAxMTBaIiBmaWxsPSIjNzc3Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZvb2QgSW1hZ2U8L3RleHQ+Cjwvc3ZnPg=="
                        }}
                      />
                      <div className="food-overlay">
                        <button className="action-btn edit-btn" onClick={() => handleOpen(food)} title="Edit">
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
                          onClick={() => handleDelete(food._id!)}
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
                    <div className="food-content">
                      <h3 className="food-name">{food.title}</h3>
                      <p className="food-description">{food.description}</p>
                      <div className="food-quantities">
                        <div className="quantity-item">
                          <span className="quantity-label">Qty 1:</span>
                          <span className="quantity-value">{food.quantityOne}</span>
                        </div>
                        {food.quantityTwo && (
                          <div className="quantity-item">
                            <span className="quantity-label">Qty 2:</span>
                            <span className="quantity-value">{food.quantityTwo}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Loading more indicator */}
              {loadingMoreFoods && (
                <div className="loading-more">
                  <div className="spinner"></div>
                  <p>Loading more delicious foods...</p>
                </div>
              )}
              {/* End of data indicator */}
              {!hasMoreFoods && displayedFoods.length > 0 && (
                <div className="end-of-data">
                  <p>You've reached the end of the menu</p>
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
                <h2>{editId ? "Edit Food Item" : "Add New Food Item"}</h2>
                <button className="modal-close" onClick={handleClose}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Food Image</label>
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
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="file-upload-btn">
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
                    <label>Food Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter food title"
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
                      placeholder="Enter food description"
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
                      placeholder="e.g., 250g, 1 piece"
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
                      placeholder="e.g., 500g, 2 pieces"
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
                    "Update Food"
                  ) : (
                    "Add Food"
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

export default FoodPage
