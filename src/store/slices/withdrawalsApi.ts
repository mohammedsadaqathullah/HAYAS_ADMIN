import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const withdrawalsApi = createApi({
  reducerPath: 'withdrawalsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Withdrawals'],
  endpoints: (builder) => ({
    getWithdrawals: builder.query<any[], string>({
      query: (email) => `/withdrawal/${email}`,
      providesTags: (result, error, email) => [{ type: 'Withdrawals', id: email }],
    }),
    getAllWithdrawals: builder.query<any[], string | undefined>({
      query: (status) => `/withdrawal/admin/all${status ? `?status=${status}` : ''}`,
      providesTags: ['Withdrawals'],
    }),
    updateWithdrawalStatus: builder.mutation<any, { id: string; data: { status: string; processedBy?: string; remarks?: string } }>({
      query: ({ id, data }) => ({
        url: `/withdrawal/${id}/status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Withdrawals'],
    }),
  }),
});

export const {
  useGetWithdrawalsQuery,
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
} = withdrawalsApi;

export default withdrawalsApi; 