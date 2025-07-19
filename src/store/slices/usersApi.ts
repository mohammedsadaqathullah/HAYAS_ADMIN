import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://hayas-backend.onrender.com',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<any[], void>({
      query: () => '/user',
      providesTags: ['Users'],
    }),
    createUser: builder.mutation<any, any>({
      query: (data) => ({
        url: '/user',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    getUserByEmail: builder.query<any, string>({
      query: (email) => `/user/by-email/${email}`,
      providesTags: (result, error, email) => [{ type: 'Users', id: email }],
    }),
    updateUser: builder.mutation<any, { email: string; data: any }>({
      query: ({ email, data }) => ({
        url: `/user/${email}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation<any, string>({
      query: (email) => ({
        url: `/user/${email}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserByEmailQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;

export default usersApi; 