// Export all Redux Toolkit API hooks
export {
  useSendOtpMutation,
  useVerifyOtpMutation,
} from '../store/slices/authApi';

export {
  useGetUsersQuery,
  useCreateUserMutation,
  useGetUserByEmailQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '../store/slices/usersApi';

export {
  useGetOrdersQuery,
  useGetOrderByEmailQuery,
  useUpdateOrderStatusMutation,
  useDeleteOrderMutation,
} from '../store/slices/ordersApi';

export {
  useGetFoodsQuery,
  useGetFoodQuery,
  useCreateFoodMutation,
  useUpdateFoodMutation,
  useDeleteFoodMutation,
} from '../store/slices/foodApi';

export {
  useGetGroceriesQuery,
  useGetGroceryQuery,
  useCreateGroceryMutation,
  useUpdateGroceryMutation,
  useDeleteGroceryMutation,
} from '../store/slices/groceryApi';

export {
  useGetToyboxzQuery,
  useGetToyboxzItemQuery,
  useCreateToyboxzMutation,
  useUpdateToyboxzMutation,
  useDeleteToyboxzMutation,
} from '../store/slices/toyboxzApi';

export {
  useGetVegFruitsQuery,
  useGetVegFruitQuery,
  useCreateVegFruitMutation,
  useUpdateVegFruitMutation,
  useDeleteVegFruitMutation,
} from '../store/slices/vegFruitsApi';

export {
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
} from '../store/slices/deliveryPartnersApi';

export {
  useGetWithdrawalsQuery,
  useGetAllWithdrawalsQuery,
  useUpdateWithdrawalStatusMutation,
} from '../store/slices/withdrawalsApi';

export {
  useUploadProductImageMutation,
} from '../store/slices/uploadApi'; 