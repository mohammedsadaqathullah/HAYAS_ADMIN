import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const deliveryPartnersApi = createApi({
  reducerPath: 'deliveryPartnersApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      // Don't set Content-Type for FormData, let the browser set it with boundary
      return headers;
    },
  }),
  tagTypes: ['DeliveryPartners', 'DPImages', 'DPStats'],
  endpoints: (builder) => ({
    // Delivery Partner CRUD
    getDeliveryPartners: builder.query<any[], void>({
      query: () => '/delivery-partner',
      providesTags: ['DeliveryPartners'],
    }),
    registerOrUpdateDeliveryPartner: builder.mutation<any, any>({
      query: (data) => ({
        url: '/delivery-partner',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    updateDeliveryPartnerStatus: builder.mutation<any, { email: string; status: string }>({
      query: ({ email, status }) => ({
        url: '/delivery-partner/status',
        method: 'PATCH',
        body: { email, status },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    getDeliveryPartnerByEmail: builder.query<any, string>({
      query: (email) => ({
        url: '/delivery-partner/by-email',
        method: 'POST',
        body: { email },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      providesTags: (result, error, email) => [{ type: 'DeliveryPartners', id: email }],
    }),

    // Delivery Partner OTP
    sendDeliveryPartnerOtp: builder.mutation<any, { email: string }>({
      query: (data) => ({
        url: '/delivery-partner/send-otp',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    verifyDeliveryPartnerOtp: builder.mutation<any, { email: string; otp: string }>({
      query: (data) => ({
        url: '/delivery-partner/verify-otp',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),

    // Delivery Partner Images
    uploadDeliveryPartnerImages: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/delivery-partners-images/upload-multiple',
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for FormData
      }),
      invalidatesTags: ['DPImages'],
    }),
    getDeliveryPartnerImages: builder.query<any, string>({
      query: (email) => `/delivery-partners-images/${email}`,
      providesTags: (result, error, email) => [{ type: 'DPImages', id: email }],
    }),
    getAllDeliveryPartnerImages: builder.query<any[], void>({
      query: () => '/delivery-partners-images',
      providesTags: ['DPImages'],
    }),

    // Duty Status
    updateDutyStatus: builder.mutation<any, { email: string; duty: boolean }>({
      query: ({ email, duty }) => ({
        url: '/delivery-status/update',
        method: 'POST',
        body: { email, duty },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    getDutyStatus: builder.query<any, string>({
      query: (email) => `/delivery-status/${email}`,
      providesTags: (result, error, email) => [{ type: 'DeliveryPartners', id: email }],
    }),

    // Stats
    getDeliveryPartnerStats: builder.query<any, string>({
      query: (email) => `/delivery-partner-stats/${email}`,
      providesTags: (result, error, email) => [{ type: 'DPStats', id: email }],
    }),
    getDeliveryPartnerStatsSummary: builder.query<any, { email: string; period?: string }>({
      query: ({ email, period = 'week' }) => `/delivery-partner-stats/${email}/summary?period=${period}`,
      providesTags: (result, error, { email }) => [{ type: 'DPStats', id: email }],
    }),
    updateOrderStats: builder.mutation<any, any>({
      query: (data) => ({
        url: '/delivery-partner-stats/update-order-stats',
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['DPStats'],
    }),
    syncWorkingHours: builder.mutation<any, { email: string; date: string }>({
      query: ({ email, date }) => ({
        url: '/delivery-partner-stats/sync-working-hours',
        method: 'POST',
        body: { email, date },
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      invalidatesTags: ['DPStats'],
    }),
  }),
});

export const {
  useGetDeliveryPartnersQuery,
  useRegisterOrUpdateDeliveryPartnerMutation,
  useUpdateDeliveryPartnerStatusMutation,
  useGetDeliveryPartnerByEmailQuery,
  useSendDeliveryPartnerOtpMutation,
  useVerifyDeliveryPartnerOtpMutation,
  useUploadDeliveryPartnerImagesMutation,
  useGetDeliveryPartnerImagesQuery,
  useGetAllDeliveryPartnerImagesQuery,
  useUpdateDutyStatusMutation,
  useGetDutyStatusQuery,
  useGetDeliveryPartnerStatsQuery,
  useGetDeliveryPartnerStatsSummaryQuery,
  useUpdateOrderStatsMutation,
  useSyncWorkingHoursMutation,
} = deliveryPartnersApi;

export default deliveryPartnersApi; 