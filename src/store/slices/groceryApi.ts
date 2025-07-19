import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const groceryApi = createApi({
  reducerPath: 'groceryApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Grocery'],
  endpoints: (builder) => ({
    getGroceries: builder.query<any[], void>({
      query: () => '/grocery',
      providesTags: ['Grocery'],
    }),
    getGrocery: builder.query<any, string>({
      query: (id) => `/grocery/${id}`,
      providesTags: (result, error, id) => [{ type: 'Grocery', id }],
    }),
    createGrocery: builder.mutation<any, any>({
      query: (data) => ({
        url: '/grocery',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Grocery'],
    }),
    updateGrocery: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/grocery/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Grocery'],
    }),
    deleteGrocery: builder.mutation<any, string>({
      query: (id) => ({
        url: `/grocery/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Grocery'],
    }),
  }),
});

export const {
  useGetGroceriesQuery,
  useGetGroceryQuery,
  useCreateGroceryMutation,
  useUpdateGroceryMutation,
  useDeleteGroceryMutation,
} = groceryApi;

export default groceryApi; 