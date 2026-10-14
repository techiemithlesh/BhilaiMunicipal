import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import CommonTable from "../../../components/common/CommonTable";
import { useLoading } from "../../../contexts/LoadingContext";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { formatLocalDate } from "../../../utils/common";
import { shopRentDemandHistoryApi } from "../../../api/endpoints";
import ShopDemandReceiptModal from "./ShopDemandReceiptModal";

function ShopDemandHistoryModal({ id, onClose }) {
  const token = getToken();
  const { setIsLoadingGable } = useLoading();
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalPage, setTotalPage] = useState(1);
  const [totalItem, setTotalItem] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isFrozen, setIsFrozen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (!isFrozen) return;
    setIsLoadingGable(true);
    return () => setIsLoadingGable(false);
  }, [isFrozen]);

  const headers = [
    { label: "#", key: "serial" },
    { label: "Demand From", key: "demandFrom" },
    { label: "Demand Upto", key: "demandUpto" },
    { label: "Demand Amount", key: "amount" },
    { label: "Penalty", key: "penalty" },
    { label: "Balance", key: "balance" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr
      key={item.id}
      className={`hover:bg-gray-50 ${
        item?.isFullPaid
          ? "bg-green-600 text-white"
          : item?.paidStatus
          ? "bg-yellow-400 text-white"
          : ""
      }`}
    >
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{formatLocalDate(item?.demandFrom)}</td>
      <td className="px-3 py-2 border">{formatLocalDate(item?.demandUpto)}</td>
      <td className="px-3 py-2 border">{item?.amount}</td>
      <td className="px-3 py-2 border">{item?.penalty}</td>
      <td className="px-3 py-2 border">{item?.balance}</td>
    </tr>
  );

  const renderFooter = (totals) => (
    <tr className="bg-gray-200 border-t font-bold">
      <td colSpan={5} className="px-3 py-2 border text-center">
        Total Due
      </td>
      <td className="px-3 py-2 border">{totals?.totalDue}</td>
    </tr>
  );

  const request = (pageNo, perPage) =>
    axios.post(
      shopRentDemandHistoryApi,
      { id, page: pageNo, perPage },
      { headers: { Authorization: `Bearer ${token}` } }
    );

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await request(page, itemsPerPage);
      const result = response?.data?.data || {};
      setSummary(result.summary || {});
      setDataList(result.data || []);
      setTotalPage(result.lastPage || 1);
      setTotalItem(result.total || 1);
    } catch (error) {
      console.error("Error fetching shop demand history:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const fetchAllData = async () => {
    setIsFrozen(true);
    try {
      const response = await request(1, totalItem);
      return response?.data?.data?.data || [];
    } catch (error) {
      console.error("Error fetching all shop demands:", error);
      return [];
    } finally {
      setIsFrozen(false);
    }
  };

  const printDemandButton = (
    <button
      type="button"
      onClick={() => setIsReceiptOpen(true)}
      className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-white whitespace-nowrap"
    >
      Print Demand Receipt
    </button>
  );

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">View Demand</h2>
          <button className="text-gray-600 hover:text-red-600" onClick={onClose}>
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div className={isFrozen ? "pointer-events-none" : ""}>
            <CommonTable
              data={dataList}
              headers={headers}
              renderRow={renderRow}
              footerRow={renderFooter(summary)}
              title="Demand History"
              isSearchInput={false}
              totalPages={totalPage}
              currentPage={page}
              setPageNo={setPage}
              totalItem={totalItem}
              setItemsPerPage={setItemsPerPage}
              itemsPerPage={itemsPerPage}
              fetchAllData={fetchAllData}
              links={Number(summary?.totalDue) > 0 ? printDemandButton : null}
            />
          </div>
        </div>
      </motion.div>

      {isReceiptOpen && (
        <ShopDemandReceiptModal id={id} onClose={() => setIsReceiptOpen(false)} />
      )}
    </div>
  );
}

export default ShopDemandHistoryModal;
