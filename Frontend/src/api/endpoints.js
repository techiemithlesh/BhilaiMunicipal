const env = import.meta.env;

export const BASE_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_API}`;
export const heartBeatApi = `${BASE_URL}/api/heartbeat`;
export const cacheClearApi = `${BASE_URL}/api/cache-clear`;
export const UlbApi = `${BASE_URL}/api/ulb/show/{id}`;
export const loginApi = `${BASE_URL}/api/login`;
export const loginChangePassApi = `${BASE_URL}/api/login-user-change-pass`;
export const logoutApi = `${BASE_URL}/api/logout`;
export const getLoginUsersApi = `${BASE_URL}/api/login-users`;
export const userApi = `${BASE_URL}/api/user`;
export const userByIdApi = `${BASE_URL}/api/user`;
export const editLoginUserApi = `${BASE_URL}/api/edit-login-user`;
export const userLockUnlockByIdApi = `${BASE_URL}/api/user-lock-unlock`;
export const userResetPassword = `${BASE_URL}/api/user-reset-password`;
export const usrProfileApi = `${BASE_URL}/api/user-profile`;
export const roleApi = `${BASE_URL}/api/role`;
export const roleUserApi = `${BASE_URL}/api/role-user-list`;
export const getWardMapApi = `${BASE_URL}/api/get-user-ward-map`;
export const getUserWardMapApi = `${BASE_URL}/api/get-user-ward-map`;
export const getWardListApi = `${BASE_URL}/api/ward`;
export const getReportToApi = `${BASE_URL}/api/get-report-to`;
export const getFyearListApi = `${BASE_URL}/api/fyear/list`;

// CITIZEN
export const googleAuthApi = `${BASE_URL}/api/citizen/google-login`;
export const socialClientIdApi = `${BASE_URL}/api/citizen/get-client-id`;
export const registerCitizenApi = `${BASE_URL}/api/citizen/register`;
export const citizenRegisterVerifyOtpApi = `${BASE_URL}/api/citizen/verifyOtp-register`;
export const citizenLoginApi = `${BASE_URL}/api/citizen/login`;
export const citizenLogoutApi = `${BASE_URL}/api/citizen/logout`;
export const citizenLoginOtpApi = `${BASE_URL}/api/citizen/login-otp`;
export const citizenPropertySearchApi = `${BASE_URL}/api/citizen/property/search`;
export const citizenApplicationListApi = `${BASE_URL}/api/citizen/app-list`;
export const citizenProfileApi = `${BASE_URL}/api/citizen/profile`;
export const citizenEditProfileApi = `${BASE_URL}/api/citizen/edit-profile`;
export const citizenDashboardApi = `${BASE_URL}/api/citizen/dashboard`;

/**
 * ==============setting [WF]======================
 */
export const dbListApi = `${BASE_URL}/api/editor/get-db`;
export const tableListApi = `${BASE_URL}/api/editor/get-table`;
export const executeQueryApi = `${BASE_URL}/api/editor/execute`;
export const bdBackupApi = `${BASE_URL}/api/editor/backup-download`;

/**
 * ==============setting [WF]======================
 */
export const wfListApi = `${BASE_URL}/api/workflow-list`;
export const wfActivateDeactivateApi = `${BASE_URL}/api/workflow-lock-unlock`;
export const wfAddApi = `${BASE_URL}/api/workflow-add`;
export const wfEditApi = `${BASE_URL}/api/workflow-edit`;

/**
 * ==============Setting[UlbNotice]=================
 */

export const publicNoticeApi = `${BASE_URL}/api/published/notice`;
export const noticeListApi = `${BASE_URL}/api/list/notice`;
export const noticeAddApi = `${BASE_URL}/api/add/notice`;
export const noticeEditApi = `${BASE_URL}/api/edit/notice`;
export const noticeDtlApi = `${BASE_URL}/api/dtl/notice`;
export const noticeLockUnlockApi = `${BASE_URL}/api/lock-unlock/notice`;

/**
 * ==============Setting[UlbOfficer]=================
 */

export const publicOfficerApi = `${BASE_URL}/api/published/officer`;
export const officerListApi = `${BASE_URL}/api/officer/list`;
export const officerAddApi = `${BASE_URL}/api/officer/add`;
export const officerEditApi = `${BASE_URL}/api/officer/edit`;
export const officerDtlApi = `${BASE_URL}/api/officer/dtl`;
export const officerLockUnlockApi = `${BASE_URL}/api/officer/lock-unlock`;

/**
 * ==============setting [Role Module Permission]======================
 */
export const ModuleListApi = `${BASE_URL}/api/module/list`;
export const RoleModuleListApi = `${BASE_URL}/api/role-permission/list`;
export const RoleModuleDtlApi = `${BASE_URL}/api/role-permission/dtl`;
export const RoleModuleAddApi = `${BASE_URL}/api/role-permission/add`;
export const RoleModuleEditApi = `${BASE_URL}/api/role-permission/edit`;
export const RoleModuleLockUnlockApi = `${BASE_URL}/api/role-permission/lock-unlock`;
/**
 * ==============setting [Property]======================
 */
export const initOnlinePropPaymentApi = `${BASE_URL}/api/property/pay-prop-demand-nttData-init`;
export const getUsageTypeListApi = `${BASE_URL}/api/property/prop-usage-type`;
export const getUsageTypeDtlApi = `${BASE_URL}/api/property/prop-usage-type-dtl`;
export const getUsageTypeAddApi = `${BASE_URL}/api/property/prop-usage-type-add`;
export const getUsageTypeEditApi = `${BASE_URL}/api/property/prop-usage-type-edit`;
export const getUsageTypeLockUnlockApi = `${BASE_URL}/api/property/prop-usage-type-lock-unlock`;

export const getOccupancyTypeListApi = `${BASE_URL}/api/property/prop-occupancy-type`;
export const getOccupancyTypeDtlApi = `${BASE_URL}/api/property/prop-occupancy-type-dtl`;
export const getOccupancyTypeAddApi = `${BASE_URL}/api/property/prop-occupancy-type-add`;
export const getOccupancyTypeEditApi = `${BASE_URL}/api/property/prop-occupancy-type-edit`;
export const getOccupancyTypeLockUnlockApi = `${BASE_URL}/api/property/prop-occupancy-type-lock-unlock`;

export const getApartmentListApi = `${BASE_URL}/api/property/prop-apartment-list`;
export const getApartmentDtlApi = `${BASE_URL}/api/property/prop-apartment-dtl`;
export const getApartmentAddApi = `${BASE_URL}/api/property/prop-apartment-add`;
export const getApartmentEditApi = `${BASE_URL}/api/property/prop-apartment-edit`;
export const getApartmentLockUnlockApi = `${BASE_URL}/api/property/prop-apartment-lock-unlock`;

export const getConstructionTypeListApi = `${BASE_URL}/api/property/prop-const-type`;
export const getConstructionTypeDtlApi = `${BASE_URL}/api/property/prop-const-type-dtl`;
export const getConstructionTypeAddApi = `${BASE_URL}/api/property/prop-const-type-add`;
export const getConstructionTypeEditApi = `${BASE_URL}/api/property/prop-const-type-edit`;
export const getConstructionTypeLockUnlockApi = `${BASE_URL}/api/property/prop-const-type-lock-unlock`;

export const getPropertyTypeListApi = `${BASE_URL}/api/property/prop-property-type`;
export const getPropertyTypeDtlApi = `${BASE_URL}/api/property/prop-property-type-dtl`;
export const getPropertyTypeAddApi = `${BASE_URL}/api/property/prop-property-type-add`;
export const getPropertyTypeEditApi = `${BASE_URL}/api/property/prop-property-type-edit`;
export const getPropertyTypeLockUnlockApi = `${BASE_URL}/api/property/prop-property-type-lock-unlock`;

export const getRoadMasterListApi = `${BASE_URL}/api/property/prop-road-mst-list`;
export const getRoadTypeListApi = `${BASE_URL}/api/property/prop-road-type`;
export const getRoadTypeDtlApi = `${BASE_URL}/api/property/prop-road-type-dtl`;
export const getRoadTypeAddApi = `${BASE_URL}/api/property/prop-road-type-add`;
export const getRoadTypeEditApi = `${BASE_URL}/api/property/prop-road-type-edit`;
export const getRoadTypeLockUnlockApi = `${BASE_URL}/api/property/prop-road-type-lock-unlock`;

export const getFloorTypeListApi = `${BASE_URL}/api/property/prop-floor-type`;
export const getFloorTypeDtlApi = `${BASE_URL}/api/property/prop-floor-type-dtl`;
export const getFloorTypeAddApi = `${BASE_URL}/api/property/prop-floor-type-add`;
export const getFloorTypeEditApi = `${BASE_URL}/api/property/prop-floor-type-edit`;
export const getFloorTypeLockUnlockApi = `${BASE_URL}/api/property/prop-floor-type-lock-unlock`;

export const getOwnershipTypeListApi = `${BASE_URL}/api/property/prop-ownership-type`;
export const getOwnershipTypeDtlApi = `${BASE_URL}/api/property/prop-ownership-type-dtl`;
export const getOwnershipTypeAddApi = `${BASE_URL}/api/property/prop-ownership-type-add`;
export const getOwnershipTypeEditApi = `${BASE_URL}/api/property/prop-ownership-type-edit`;
export const getOwnershipTypeLockUnlockApi = `${BASE_URL}/api/property/prop-ownership-type-lock-unlock`;

export const propertyTestRequestApi = `${BASE_URL}/api/property/test-request`;

export const wfPermissionApi = `${BASE_URL}/api/get-workflow-permission`;

export const getMenuListApi = `${BASE_URL}/api/menu-list`;
export const getSubMenuListApi = `${BASE_URL}/api/sub-menu-list`;
export const getMenuDtlByIdApi = `${BASE_URL}/api/menu-detail`;
export const menuAddApi = `${BASE_URL}/api/menu-add`;
export const menuEditApi = `${BASE_URL}/api/menu-edit`;
export const menuLockUnlockApi = `${BASE_URL}/api/menu-lock-unlock`;
export const menuUserExcludeIncludeListApi = `${BASE_URL}/api/menu-user-exclude-include-list`;
export const menuUserIncludeApi = `${BASE_URL}/api/menu-user-include-add`;
export const menuUserExcludeApi = `${BASE_URL}/api/menu-user-exclude-add`;

export const getMobileMenuListApi = `${BASE_URL}/api/menu-list-mobile`;
export const getMobileSubMenuListApi = `${BASE_URL}/api/sub-menu-list-mobile`;
export const getMobileMenuDtlByIdApi = `${BASE_URL}/api/menu-detail-mobile`;
export const menuMobileAddApi = `${BASE_URL}/api/menu-add-mobile`;
export const menuMobileEditApi = `${BASE_URL}/api/menu-edit-mobile`;
export const mobileMenuLockUnlockApi = `${BASE_URL}/api/menu-lock-unlock-mobile`;
export const menuMobileUserExcludeIncludeListApi = `${BASE_URL}/api/menu-user-exclude-include-list-mobile`;
export const menuMobileUserIncludeApi = `${BASE_URL}/api/menu-user-include-add-mobile`;
export const menuMobileUserExcludeApi = `${BASE_URL}/api/menu-user-exclude-add-mobile`;
export const modalLogListApi = `${BASE_URL}/api/log/list`;
/**
 * ====end hear setting api
 */

export const getSafMstrDataApi = `${BASE_URL}/api/property/get-saf-master-data`;
export const getSwmSubCategoryListApi = `${BASE_URL}/api/property/get-swm-subCategory`;
export const getSwmRateApi = `${BASE_URL}/api/property/get-swm-rate`;
export const getNewWardByOldWardApi = `${BASE_URL}/api/property/get-new-ward-by-old`;
export const getApartmentListByOldWardApi = `${BASE_URL}/api/property/get-apartment-by-old-ward`;
export const safApplyApi = `${BASE_URL}/api/property/saf-apply`;
export const safEditApi = `${BASE_URL}/api/property/saf-edit-basic`;
export const safListForAutoApprovedApi = `${BASE_URL}/api/property/saf-auto-forward-list`;
export const safAddAutoApprovedApi = `${BASE_URL}/api/property/saf-auto-forward`;
export const reviewTaxApi = `${BASE_URL}/api/property/review-tax`;
export const safApplicationSearch = `${BASE_URL}/api/property/search-saf`;
export const safApplicationDetailsApi = `${BASE_URL}/api/property/get-saf-dtl`;
export const safDocListApi = `${BASE_URL}/api/property/doc-list`;
export const safDocUploadApi = `${BASE_URL}/api/property/uploaded-doc`;
export const safUploadedDocListApi = `${BASE_URL}/api/property/get-uploaded-doc-list`;
export const safDocVerifyApi = `${BASE_URL}/api/property/doc-verify`;
export const safDueApi = `${BASE_URL}/api/property/get-saf-demand`;
export const safPaymentApi = `${BASE_URL}/api/property/pay-saf-demand`;
export const safPaymentReceiptApi = `${BASE_URL}/api/property/payment-receipt`;
export const memoReceiptApi = `${BASE_URL}/api/property/memo-receipt`;
export const verificationDtlApi = `${BASE_URL}/api/property/field-verification-dtl`;
export const updateSafApplicationApi = `${BASE_URL}/api/property/saf-edit-basic`;

export const safInboxApi = `${BASE_URL}/api/property/inbox`;
export const safPostNextLevelApi = `${BASE_URL}/api/property/post-next`;
export const safForVerificationApi = `${BASE_URL}/api/property/get-saf-field-verification`;

export const safGeoTagApi = `${BASE_URL}/api/property/geotage`;

export const getUserProfileUpdateUrl = (id) => `${userApi}/${id}`;

export const propertySearchApi = `${BASE_URL}/api/property/search-prop`;
export const propertyDetailsApi = `${BASE_URL}/api/property/get-prop-dtl`;
export const propDueApi = `${BASE_URL}/api/property/get-prop-demand`;
export const propBasicEditApi = `${BASE_URL}/api/property/prop-edit-basic`;
export const propOwnerEditApi = `${BASE_URL}/api/property/prop-edit-owner`;
export const validateHoldingNoApi = `${BASE_URL}/api/property/validate-holding`;
export const validateSafNoApi = `${BASE_URL}/api/property/validate-saf`;
export const propertyGenerateNoticeApi = `${BASE_URL}/api/property/prop-generate-notice`;
export const propertyNoticeListApi = `${BASE_URL}/api/property/prop-notice-list`;
export const propertyNoticeReceiptApi = `${BASE_URL}/api/property/prop-notice-receipt`;
export const propertyNoticeDeactivateApi = `${BASE_URL}/api/property/prop-notice-deactivate`;
export const addExistingPropertyApi = `${BASE_URL}/api/property/add-existing-prop`;
export const addExistingPropertyTestReqApi = `${BASE_URL}/api/property/test-add-existing-prop`;
export const validateHoldingUniqueApi = `${BASE_URL}/api/property/validate-existing-holding-no`;
export const propPaymentApi = `${BASE_URL}/api/property/pay-prop-demand`;
export const MemoReceiptApi = `${BASE_URL}/api/property/memo-receipt`;
export const deactivatePropertyApi = `${BASE_URL}/api/property/prop-deactivate`;

/**
 * property Reports
 */
export const propPaymentModeListApi = `${BASE_URL}/api/property/report/payment-mode`;
export const propCollectionApi = `${BASE_URL}/api/property/report/collection`;
export const propCollectionSummaryApi = `${BASE_URL}/api/property/report/collection-summary`;
export const propWfRoleListApi = `${BASE_URL}/api/property/report/wf-role-list`;
export const roleWisePendingApi = `${BASE_URL}/api/property/report/role-wise-pending-saf`;
export const levelWisePendingApi = `${BASE_URL}/api/property/report/level-wise-pending-saf`;
export const levelUserWisePendingApi = `${BASE_URL}/api/property/report/role-user-wise-pending-saf`;
export const propertyWardWiseDCBApi = `${BASE_URL}/api/property/report/ward-wise-dcb`;
export const propertyWiseDCBApi = `${BASE_URL}/api/property/report/prop-dcb`;
export const dateWiseApplySafApi = `${BASE_URL}/api/property/report/date-wise-applied-saf`;
export const monthWisePropDemandDueApi = `${BASE_URL}/api/property/report/month-wise-prop-demand-due`;

// Trade
export const getTradeMstrDataApi = `${BASE_URL}/api/trade/get-trade-master-data`;
export const getTradeTaxDetailsApi = `${BASE_URL}/api/trade/review-tax`;

export const applyTradeApi = `${BASE_URL}/api/trade/apply`;
export const tradeEditApi = `${BASE_URL}/api/trade/edit`;
export const testTradePayloadApi = `${BASE_URL}/api/trade/test-request`;
export const searchTradeApi = `${BASE_URL}/api/trade/search`;
export const tradeApplicationDetailsApi = `${BASE_URL}/api/trade/get-dtl`;
export const tradeGetPaymentDueApi = `${BASE_URL}/api/trade/get-due`;
export const tradeInboxApi = `${BASE_URL}/api/trade/inbox`;
export const tradeDocListApi = `${BASE_URL}/api/trade/doc-list`;
export const tradeDocUploadApi = `${BASE_URL}/api/trade/uploaded-doc`;
export const tradeGetUploadedDocListApi = `${BASE_URL}/api/trade/get-uploaded-doc-list`;
export const tradeDocVerifyApi = `${BASE_URL}/api/trade/doc-verify`;
export const tradePostNextLevelApi = `${BASE_URL}/api/trade/post-next`;
export const tradeLicenseReceiptApi = `${BASE_URL}/api/trade/license-receipt`;

/**
 * Trade Reports
 */
export const tradePaymentModeListApi = `${BASE_URL}/api/trade/report/payment-mode`;
export const tradeCollectionApi = `${BASE_URL}/api/trade/report/collection`;
export const tradeCollectionSummaryApi = `${BASE_URL}/api/trade/report/collection-summary`;
export const tradeWfRoleListApi = `${BASE_URL}/api/trade/report/wf-role-list`;
export const tradeRoleWisePendingApi = `${BASE_URL}/api/trade/report/role-wise-pending-trade`;
export const tradeLevelWisePendingApi = `${BASE_URL}/api/trade/report/level-wise-pending-trade`;
export const tradeLevelUserWisePendingApi = `${BASE_URL}/api/trade/report/role-user-wise-pending-trade`;
export const tradeWardWiseDCBApi = `${BASE_URL}/api/trade/report/ward-wise-dcb`;
export const tradeWiseDCBApi = `${BASE_URL}/api/trade/report/trade-dcb`;

// MainDashboard

export const holdingDemandCollectionDueApi = `${BASE_URL}/api/dashboard/property/demand-collection-due`;
export const appliedSafApi = `${BASE_URL}/api/dashboard/property/applied-saf`;

export const tradePayDemandApi = `${BASE_URL}/api/trade/pay-demand`;
export const tradePaymentReceiptApi = `${BASE_URL}/api/trade/payment-receipt`;

// Water Apis

export const waterGetMasterDataApi = `${BASE_URL}/api/water/app/master-data`;
export const waterApplyTestPayloadApi = `${BASE_URL}/api/water/app/test-request`;
export const waterApplyReviewTaxApi = `${BASE_URL}/api/water/app/review-tax`;
export const waterApplyApi = `${BASE_URL}/api/water/app/apply-connection`;
export const waterAppSearchApi = `${BASE_URL}/api/water/app/search`;
export const waterAppDetailApi = `${BASE_URL}/api/water/app/dtl`;
export const waterAppEditApi = `${BASE_URL}/api/water/app/edit`;
export const waterAppDueApi = `${BASE_URL}/api/water/app/due`;
export const waterAppDuePaymentApi = `${BASE_URL}/api/water/app/pay-demand`;
export const waterAppPaymentReceiptApi = `${BASE_URL}/api/water/app/payment-receipt`;
export const waterAppDocListApi = `${BASE_URL}/api/water/app/doc-list`;
export const waterAppDocUploadApi = `${BASE_URL}/api/water/app/uploaded-doc`;
export const waterAppUploadedDocListApi = `${BASE_URL}/api/water/app/get-uploaded-doc-list`;
export const waterAppDocVerifyApi = `${BASE_URL}/api/water/app/doc-verify`;
export const waterAppInboxApi = `${BASE_URL}/api/water/app/inbox`;
export const waterAppBTCListApi = `${BASE_URL}/api/water/app/btc-list`;
export const waterAppPostNextLevelApi = `${BASE_URL}/api/water/app/post-next`;
export const waterAppFieldVerificationDtlApi = `${BASE_URL}/api/water/app/field-verification-dtl`;

// water consumer
export const waterConsumerSearchApi = `${BASE_URL}/api/water/consumer/search`;
export const waterConsumerDetailApi = `${BASE_URL}/api/water/consumer/dtl`;
export const waterConsumerDueApi = `${BASE_URL}/api/water/consumer/due`;
export const waterConsumerDuePaymentApi = `${BASE_URL}/api/water/consumer/pay-due`;
export const waterMeterTypeListApi = `${BASE_URL}/api/water/consumer/meter-type/list`;
export const waterConsumerUpdateConnectionApi = `${BASE_URL}/api/water/consumer/update-connection`;
export const waterConsumerDemandGenerateApi = `${BASE_URL}/api/water/consumer/generate-demand`;
export const waterConsumerDemandHistoryApi = `${BASE_URL}/api/water/consumer/demand-history`;

/**
 * Water Reports
 */
export const waterPaymentModeListApi = `${BASE_URL}/api/water/report/payment-mode`;
export const waterCollectionApi = `${BASE_URL}/api/water/report/collection`;
export const waterCollectionSummaryApi = `${BASE_URL}/api/water/report/collection-summary`;
export const waterWfRoleListApi = `${BASE_URL}/api/water/report/wf-role-list`;
export const waterWisePendingApi = `${BASE_URL}/api/water/report/role-wise-pending-app`;
export const waterLevelWisePendingApi = `${BASE_URL}/api/water/report/level-wise-pending-app`;
export const waterLevelUserWisePendingApi = `${BASE_URL}/api/water/report/role-user-wise-pending-app`;
export const waterWardWiseConsumerApi = `${BASE_URL}/api/water/report/ward-wise-consumer`;
export const waterWardWiseDCBApi = `${BASE_URL}/api/water/report/ward-wise-dcb`;
export const waterConsumerWiseDCBApi = `${BASE_URL}/api/water/report/consumer-dcb`;
// export const propPaymentApi = `${BASE_URL}/api/property/pay-prop-demand`;

// Accounts
export const cashUserListApi = `${BASE_URL}/api/account/cash-user/list`;
export const cashUserApi = `${BASE_URL}/api/account/user/cash`;
export const cashVerificationApi = `${BASE_URL}/api/account/cash/verification`;
export const chequeReconciliationListApi = `${BASE_URL}/api/account/bank/reconciliation/list`;
export const chequeReconciliationApi = `${BASE_URL}/api/account/bank/reconciliation`;
export const searchTransactionApi = `${BASE_URL}/api/account/search/transaction`;
export const updatePaymentModeApi = `${BASE_URL}/api/account/update/payment-mode`;
export const tranDeactivationApi = `${BASE_URL}/api/account/deactivate/transaction`;
export const tranDeactivationListApi = `${BASE_URL}/api/account/deactivate/transaction/list`;
export const collectionSummaryApi = `${BASE_URL}/api/account/collection/summary`;
export const dateWiseCollectionApi = `${BASE_URL}/api/account/date-wise/collection`;
