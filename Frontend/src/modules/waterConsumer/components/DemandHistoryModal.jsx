import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { getToken } from "../../../utils/auth";
import { FaTimes } from "react-icons/fa";
import CommonTable from "../../../components/common/CommonTable";
import { waterConsumerDemandHistoryApi } from "../../../api/endpoints";
import { formatLocalDate } from "../../../utils/common";

function DemandHistoryModal({ id, onClose, openPreviewModel }) {
  const token = getToken();
  const [dataList, setDataList] = useState([]);
  const [summary, setSummary] = useState({});
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFrozen, setIsFrozen] = useState(false);

  const headers = [
    { label: "#", key: "serial" },
    { label: "Demand From", key: "demandFrom" },
    { label: "Demand Upto", key: "demandUpto" },
    { label: "Demand Type", key: "demandType" },
    { label: "Demand Amount To", key: "amount" },
    { label: "Balance", key: "balance" },
    { label: "From Reading", key: "fromReading" },
    { label: "Upto Reading", key: "currentMeterReading" },
    { label: "Unit Amount", key: "unitAmount" },
    { label: "Meter No", key: "meterNo" },
    { label: "Reading Img", key: "docPath" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
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
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{formatLocalDate(item?.demandFrom)}</td>
      <td className="px-3 py-2 border">{formatLocalDate(item?.demandUpto)}</td>
      <td className="px-3 py-2 border">{item.demandType}</td>
      <td className="px-3 py-2 border">{item.amount}</td>
      <td className="px-3 py-2 border">{item.balance}</td>
      <td className="px-3 py-2 border">{item.fromReading}</td>
      <td className="px-3 py-2 border">{item.currentMeterReading}</td>
      <td className="px-3 py-2 border">{item.unitAmount}</td>
      <td className="px-3 py-2 border">{item.meterNo}</td>
      <td className="px-3 py-2 border">
        {item?.docPath ? (
          <img
            onClick={() => openPreviewModel(item?.docPath)}
            src={item?.docPath}
            className="inline-block mr-3 ml-2 border border-gray-300 rounded-full w-10 h-10 object-cover cursor-pointer"
          />
        ) : (
          "N/A"
        )}
      </td>
    </tr>
  );

  const renderFooter = (totals) => (
    <tr className="bg-gray-200 border-t font-bold">
      <td colSpan={5} className="px-3 py-2 border text-center">
        Total
      </td>
      <td className="px-3 py-2 border">{totals.totalDue}</td>
      <td colSpan={5} className="px-3 py-2 border"></td>
    </tr>
  );

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        waterConsumerDemandHistoryApi,
        {
          id,
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSummary(response.data.data?.summary || {});
      setDataList(response.data.data?.data || []);
      setTotalPage(response.data.data?.lastPage || 1);
      setTotalItem(response.data.data?.total || 1);
    } catch (error) {
      console.error("Error fetching menu list:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [page, itemsPerPage]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const fetchAllData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        waterConsumerDemandHistoryApi,
        {
          id,
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return (response?.data?.data?.data || []).map((item) => ({
        ...item,
        docPath: ``,
      }));
    } catch (error) {
      console.error("Error fetching all menus:", error);
    } finally {
      setIsFrozen(false);
    }
  };
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
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="relative flex-grow overflow-y-auto">
          <div
            className={`${
              isFrozen ? "pointer-events-none filter blur-sm" : ""
            }`}
          >
            <CommonTable
              data={dataList}
              headers={headers}
              renderRow={renderRow}
              footerRow={renderFooter(summary)}
              title="Demand History"
              totalPages={totalPage}
              currentPage={page}
              setPageNo={setPage}
              totalItem={totalItem}
              setItemsPerPage={setItemsPerPage}
              itemsPerPage={itemsPerPage}
              search={search}
              setSearch={setSearch}
              onSearch={handleSearch}
              fetchAllData={fetchAllData}
            />
          </div>

          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default DemandHistoryModal;
