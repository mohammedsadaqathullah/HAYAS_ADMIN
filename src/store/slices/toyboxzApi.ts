import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const toyboxzApi = createApi({
  reducerPath: 'toyboxzApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Toyboxz'],
  endpoints: (builder) => ({
    getToyboxz: builder.query<any[], void>({
      query: () => '/toyboxz',
      providesTags: ['Toyboxz'],
    }),
    getToyboxzItem: builder.query<any, string>({
      query: (id) => `/toyboxz/${id}`,
      providesTags: (result, error, id) => [{ type: 'Toyboxz', id }],
    }),
    createToyboxz: builder.mutation<any, any>({
      query: (data) => ({
        url: '/toyboxz',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Toyboxz'],
    }),
    updateToyboxz: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({
        url: `/toyboxz/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Toyboxz'],
    }),
    deleteToyboxz: builder.mutation<any, string>({
      query: (id) => ({
        url: `/toyboxz/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Toyboxz'],
    }),
  }),
});

export const {
  useGetToyboxzQuery,
  useGetToyboxzItemQuery,
  useCreateToyboxzMutation,
  useUpdateToyboxzMutation,
  useDeleteToyboxzMutation,
} = toyboxzApi;

export default toyboxzApi; 