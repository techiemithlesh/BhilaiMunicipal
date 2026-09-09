export const formData = [
  {
    label: "Application Type",
    key: "applicationType",
    value: "RENEWAL",
    required: true,
  },
  {
    label: "Firm Type",
    key: "firmType",
    value: "PROPRIETORSHIP",
    required: true,
  },
  {
    label: "Type of Ownership of Business Premises",
    key: "ownership",
    value: "OWN PROPERTY",
  },
  { label: "License No.", key: "licenseNo", value: "8583" },
  { label: "Category", key: "category", value: "Others", required: true },
];

export const firmDetails = [
  {
    label: "Holding No.",
    name: "holdingNo",
    value: "0010000771000X1",
    required: true,
  },
  { label: "Ward No.", name: "wardNo", value: "1", required: true },
  {
    label: "Firm Name",
    name: "firmName",
    value: "SHANTI NIKETAN",
    required: true,
  },
  {
    label: "Total Area (in Sq. Ft)",
    name: "totalArea",
    value: "180.00",
    required: true,
  },
  {
    label: "Firm Establishment Date",
    name: "firmEstDate",
    value: "2017-10-09",
    required: true,
    type: "date",
  },
  {
    label: "Business Address",
    name: "businessAddress",
    value: "OPP S.S MEMORIAL COLLEGE RANCHI",
    required: true,
  },
  { label: "Pin Code", name: "pinCode", value: "0", required: true },
  { label: "New Ward No.", name: "newWardNo", value: "", required: true },
  {
    label: "Owner of Business Premises",
    name: "ownerOfPremises",
    value: "SMT. URMILA DEVI",
  },
  { label: "Landmark", name: "landmark", value: "" },
  {
    label: "Business Description",
    name: "businessDesc",
    value: "XEROX SHOP STUDIO",
    required: true,
  },
];

export const tableHeaders = [
  { key: "ownerName", label: "Owner Name", required: true },
  { key: "guardianName", label: "Guardian Name" },
  { key: "mobile", label: "Mobile No", required: true },
  { key: "email", label: "Email Id" },
  { key: "upload", label: "Upload" },
];

export const tableRows = [
  {
    ownerName: "PRAKASH RAJAN SRIVASTAVA",
    guardianName: "LATE MADAN MEHAN SRIVASTAV",
    mobile: "9876543210",
    email: null,
  },
  {
    ownerName: "RAHUL SHARMA",
    guardianName: "LATE RAMESH SHARMA",
    mobile: "",
    email: "rahul@example.com",
  },
];

export const natureOfBuisness =
  "MATCH MATCHES FOR LIGHTING INCLUDING BENGAL MATCHES MANUFACTURING PARCHING PACKING PRESSING CLEANING CLEANSING BOILING MELTING GRINDING OR PREPARING BY ANY PROCESS GRINDING WHATSOEVER EXCEPT FOR DOMESTICS PURPOSES";

export const documentHeaders = [
  { key: "name", label: "Document Name", required: true },
  { key: "status", label: "Document Image" },
  { key: "upload", label: "Upload" },
];

export const documentRows = [
  {
    name: "Affidavit",
    file: null,
    options: [
      "AN AFFIDAVIT ON RS 10/- NON-JUDICIAL STAMP PAPER TO THE EFFECT THAT MUNICIPAL TRADE LICENCE IS SURRENDERED",
    ],
  },
  {
    name: "Trade Licence",
    file: null,
    options: ["PREVIOUS MUNICIPAL TRADE LICENCE"],
  },
];

export const tradeHeaders = [
  { key: "item", label: "Trade Item", required: true },
  { key: "code", label: "Trade Code", required: true },
];

export const tradeRows = [
  {
    item: "BOARDING AND LODGING HOUSE INCLUDING PAYING GUEST ACCOMMODATION AND WORKING MEN WOMEN HOSTELS KEEPING",
    code: "19",
  },
];
