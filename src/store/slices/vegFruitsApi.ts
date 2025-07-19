import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const vegFruitsApi = createApi({
  reducerPath: 'vegFruitsApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['VegFruit'],
  endpoints: (builder) => ({
    getVegFruits: builder.query<any[], void>({
      query: () => '/vegetables-and-fruits',
      providesTags: ['VegFruit'],
    }),
    getVegFruit: builder.query<any, string>({
      query: (id) => `/vegetables-and-fruits/${id}`,
      providesTags: (result, error, id) => [{ type: 'VegFruit', id }],
    }),
    createVegFruit: builder.mutation<any, any>({
      query: (data) => ({
        url: '/vegetables-and-fruits',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['VegFruit'],
    }),
    updateVegFruit: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/vegetables-and-fruits/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['VegFruit'],
    }),
    deleteVegFruit: builder.mutation<any, string>({
      query: (id) => ({
        url: `/vegetables-and-fruits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['VegFruit'],
    }),
  }),
});

export const {
  useGetVegFruitsQuery,
  useGetVegFruitQuery,
  useCreateVegFruitMutation,
  useUpdateVegFruitMutation,
  useDeleteVegFruitMutation,
} = vegFruitsApi;

export default vegFruitsApi; 