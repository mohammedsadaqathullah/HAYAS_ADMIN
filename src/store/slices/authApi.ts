import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    sendOtp: builder.mutation<any, { email: string }>({
      query: (credentials) => ({
        url: '/admin-user/auth/send-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyOtp: builder.mutation<any, { email: string; otp: string }>({
      query: (credentials) => ({
        url: '/admin-user/auth/verify-otp',
        method: 'POST',
        body: credentials,
      }),
    }),
    getAdminUserByEmail: builder.query({
      query: (email) => `/admin-user/${email}`,
    }),
  }),
});

export const { useSendOtpMutation, useVerifyOtpMutation,useGetAdminUserByEmailQuery,useLazyGetAdminUserByEmailQuery } = authApi;

export default authApi; 