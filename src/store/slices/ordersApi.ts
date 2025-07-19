import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    getOrders: builder.query<any[], void>({
      query: () => '/orders',
      providesTags: ['Orders'],
    }),
    getOrderByEmail: builder.query<any[], string>({
      query: (email) => `/orders/${email}`,
      providesTags: (result, error, email) => [{ type: 'Orders', id: email }],
    }),
    updateOrderStatus: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/orders/${id}/admin-status`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Orders'],
    }),
    deleteOrder: builder.mutation<any, string>({
      query: (id) => ({
        url: `/orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderByEmailQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} = ordersApi;

export default ordersApi; 