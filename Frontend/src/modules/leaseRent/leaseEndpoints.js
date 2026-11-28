import { BASE_URL } from "../../api/endpoints";

// Lease Rent Module API Endpoints



export const leaseRentUpdateHoldingApi = `${BASE_URL}/api/lease-rent/update-holding`;
export const leaseRentPaymentApi = `${BASE_URL}/api/lease-rent/pay-demand`;
export const leaseRentGenerateDemandApi = `${BASE_URL}/api/lease-rent/generate-demand`;
export const leaseRentDemandReceiptApi = `${BASE_URL}/api/lease-rent/demand-receipt`;

// Lease Rent Report Endpoints
export const leaseRentCollectionApi = `${BASE_URL}/api/lease-rent/report/collection`;
export const leaseCollectionSummaryApi = `${BASE_URL}/api/lease-rent/report/collection-summary`;
export const leasePaymentModeListApi = `${BASE_URL}/api/lease-rent/report/payment-mode-list`;
export const leaseRentTeamSummaryApi = `${BASE_URL}/api/lease-rent/report/team-summary`;
