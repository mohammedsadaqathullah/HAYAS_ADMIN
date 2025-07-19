import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

// Updated interface to match the backend response structure
interface UploadedImageDetail {
  url: string
  filename: string
  _id: string
  uploadedAt: string
}

interface UploadResponse {
  message: string
  data: {
    _id: string
    name: string
    images: UploadedImageDetail[]
  }
}

export const uploadApi = createApi({
  reducerPath: "uploadApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://hayas-backend.onrender.com" }),
  endpoints: (builder) => ({
    // Updated mutation return type to UploadResponse
    uploadProductImage: builder.mutation<UploadResponse, FormData>({
      query: (formData) => ({
        url: "uploadImages",
        method: "POST",
        body: formData,
      }),
    }),
    deleteImage: builder.mutation<void, string>({
      query: (filename) => ({
        url: `uploadImages/file/${filename}`,
        method: "DELETE",
      }),
    }),
  }),
})

export const { useUploadProductImageMutation, useDeleteImageMutation } = uploadApi
