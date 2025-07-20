import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const foodApi = createApi({
  reducerPath: 'foodApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Food'],
  endpoints: (builder) => ({
    getFoods: builder.query<any[], void>({
      query: () => '/food',
      providesTags: ['Food'],
    }),
    getFood: builder.query<any, string>({
      query: (id) => `/food/${id}`,
      providesTags: (result, error, id) => [{ type: 'Food', id }],
    }),
    createFood: builder.mutation<any, any>({
      query: (data) => ({
        url: '/food',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Food'],
    }),
    updateFood: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/food/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Food'],
    }),
    deleteFood: builder.mutation<any, string>({
      query: (id) => ({
        url: `/food/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Food'],
    }),
  }),
});

export const {
  useGetFoodsQuery,
  useGetFoodQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} = foodApi;

export default foodApi; 