import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Select from "react-select";
import { getToken } from "../../../utils/auth";
import {
  getWardListApi,
  swmConsumerBulkPaymentReceiptApi,
} from "../../../api/endpoints";
import PaymentReceiptDtl from "../components/PaymentReceiptDtl";
import { handleGeneratePdf, usePrint } from "../../../utils/common";

const BulkPaymentReceipt = () => {
  const token = getToken();
  const printRef = useRef();
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [wardId, setWardId] = useState([]);
  const [wards, setWards] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // ✅ Fetch available wards
  useEffect(() => {
    const fetchWards = async () => {
      try {
        const res = await axios.get(getWardListApi, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            all: true,
          },
        });
        setWards(res.data?.data);
      } catch (error) {
        console.error("Error fetching wards:", error);
      }
    };
    fetchWards();
  }, []);

  // ✅ Fetch receipt list
  const fetchReceipts = async (pageNo = 1) => {
    setLoading(true);
    try {
      const res = await axios.post(
        swmConsumerBulkPaymentReceiptApi,
        {
          fromDate: fromDate,
          uptoDate: toDate,
          wardId: wardId,
          page: pageNo,
          perPage: itemsPerPage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReceipts(res.data?.data?.data);
      setTotalPages(res.data?.data?.lastPage || 1);
      setPage(res.data?.data?.currentPage || 1);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchReceipts(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) fetchReceipts(newPage);
  };


  // const handlePrint = async () => {
  //       setLoading(true);
  //       await handleGeneratePdf(printRef);
  //       setLoading(false);
  //   };

  const handlePrint = usePrint(printRef,`${"Payment Receipt" || ""}`);

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      {/* Filter Section */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-4 border p-4 rounded-lg mb-6"
      >
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Date From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border px-3 py-1.5 rounded focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Date To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border px-3 py-1.5 rounded focus:outline-none"
            required
          />
        </div>

        <div className="flex flex-col min-w-[200px]">
          <label className="text-sm font-semibold mb-1">Ward No</label>
          <Select
            isMulti
            options={wards.map((w) => ({
              value: w.id,
              label: w.wardNo,
            }))}
            value={wards
              .filter((w) => wardId.includes(w.id))
              .map((w) => ({ value: w.id, label: w.wardNo }))}
            onChange={(selectedOptions) =>
              setWardId(selectedOptions.map((opt) => opt.value))
            }
            placeholder="Select Ward(s)..."
            className="text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Items Per Page</label>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border px-3 py-1.5 rounded focus:outline-none"
          >
            {[5, 10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-sky-500 text-white px-4 py-2 rounded hover:bg-sky-600"
        >
          View
        </button>

        {receipts.length > 0 && (
          <button
            type="button"
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Print All
          </button>
        )}
      </form>

      {/* Receipt List */}
      {loading ? (
        <p className="text-center text-gray-600">Loading receipts...</p>
      ) : receipts.length > 0 ? (
        <>
          <div ref={printRef}>
            {receipts.map((item, index) => (
              <div className="receipt mt-2 print:border-none" key={index}>
                <PaymentReceiptDtl data={item?.receipt} id={item?.id} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-4 gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p className="text-center text-gray-500">No receipts found.</p>
      )}
    </div>
  );
};

export default BulkPaymentReceipt;
