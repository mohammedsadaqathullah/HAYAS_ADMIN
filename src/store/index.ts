import { configureStore } from '@reduxjs/toolkit';
import authApi from './slices/authApi';
import usersApi from './slices/usersApi';
import ordersApi from './slices/ordersApi';
import foodApi from './slices/foodApi';
import groceryApi from './slices/groceryApi';
import toyboxzApi from './slices/toyboxzApi';
import vegFruitsApi from './slices/vegFruitsApi';
import deliveryPartnersApi from './slices/deliveryPartnersApi';
import withdrawalsApi from './slices/withdrawalsApi';
import { uploadApi } from './slices/uploadApi';

export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [foodApi.reducerPath]: foodApi.reducer,
    [groceryApi.reducerPath]: groceryApi.reducer,
    [toyboxzApi.reducerPath]: toyboxzApi.reducer,
    [vegFruitsApi.reducerPath]: vegFruitsApi.reducer,
    [deliveryPartnersApi.reducerPath]: deliveryPartnersApi.reducer,
    [withdrawalsApi.reducerPath]: withdrawalsApi.reducer,
    [uploadApi.reducerPath]: uploadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      usersApi.middleware,
      ordersApi.middleware,
      foodApi.middleware,
      groceryApi.middleware,
      toyboxzApi.middleware,
      vegFruitsApi.middleware,
      deliveryPartnersApi.middleware,
      withdrawalsApi.middleware,
      uploadApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 