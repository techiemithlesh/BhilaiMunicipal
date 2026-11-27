// Temporary dummy JSON data for LeaseDetails page preview
// Delete this file and its fallback usage in LeaseDetails.jsx once backend APIs are connected

export const DUMMY_LEASE_DETAILS = {
  id: 1,
  wardNo: "1",
  consumerNo: "BHMC298579",
  consumerName: "ADITYA SHAH",
  guardianName: "SAILESH SHAH",
  mobileNo: "7869920195",
  relationType: "S/O",
  holdingNo: "",
  propertyDetailId: null,
  address: "NEHRU NAGAR WEST PLOT 6 BLOCK 68",
  nigamLeaseNo: "BHMC298579",
  leaseArea: "NEHRU NAGAR WEST",
  useOfLand: "Residential",
  width: 0,
  length: 0,
  totalArea: 0,
  plotAddress: "NEHRU NAGAR WEST PLOT 6 BLOCK 68",
  leaseAmount: 4158.0,
  leaseStartDate: "2019-04-01",
  lockStatus: false,
  userPermission: {
    canGenerateDemand: true,
  },
  owners: [
    {
      id: 1,
      ownerName: "ADITYA SHAH",
      guardianName: "SAILESH SHAH",
      relationType: "S/O",
      mobileNo: "7869920195",
    },
  ],
  leaseRents: [
    {
      id: 1,
      leaseAmount: "4158.00",
      effectiveDate: "2019-04-01",
      docPath: "NA",
      isCurrent: true,
    },
  ],
  tranDtls: [
    {
      id: 101,
      tranNo: "LR-2025-000142",
      paymentMode: "CASH",
      tranDate: "2025-05-15",
      fromDate: "2024-04-01",
      uptoDate: "2025-03-31",
      demandAmt: "4158.00",
      penaltyAmt: "0.00",
      payableAmt: "4158.00",
    },
  ],
};
