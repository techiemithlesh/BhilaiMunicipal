import axios from "axios";
import { useEffect, useState } from "react";
import { swmConsumerDailyVisitingLogApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { formatTimeAMPM } from "../../../utils/common";
import { Spinner } from "@nextui-org/react";

function VisitingLogModal({ id, onClose, onSuccess }) {
  const token = getToken();
  const [isFrozen, setIsFrozen] = useState(false);
  const [logList, setLogList] = useState([]);
  const [openIndexes, setOpenIndexes] = useState([]);


  useEffect(() => {
    if (id && token) fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsFrozen(true);
    try {
      const response = await axios.post(
        swmConsumerDailyVisitingLogApi,
        { id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data?.status) {
        const logs = response?.data?.data ?? [];
        setLogList(logs);

        // 👉 Open LAST MONTH by default
        if (logs.length > 0) {
          setOpenIndexes([logs.length - 1]);
        }
      }
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsFrozen(false);
    }
  };


  const toggleAccordion = (index) => {
    setOpenIndexes((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index) // close tab
        : [...prev, index]                // open tab
    );
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
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">
            RFID Visiting Logs
          </h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="relative flex-grow overflow-y-auto">
          {isFrozen&&(
            <Spinner />
          )}
          <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""}`}>
            {/* Accordion Section */}
            {logList.map((monthItem, index) => (
              <div
                key={index}
                className="border border-gray-300 rounded-lg mb-3"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center px-4 py-3 bg-gray-100 hover:bg-gray-200"
                >
                  <span className="font-semibold text-gray-800">
                    {monthItem.month} ({monthItem.totalNoOfDay} days) 
                    {monthItem?.totalVisitDay>0 &&(
                      <span className="text-small text-green-400"> [{monthItem?.totalVisitDay}]</span>
                    )}
                  </span>

                  {openIndexes.includes(index) ? (
                    <FaChevronUp />
                  ) : (
                    <FaChevronDown />
                  )}
                </button>

                {/* Accordion Body */}
                {openIndexes.includes(index) && (
                  <div className="px-4 py-3 grid grid-cols-7 gap-2 bg-white">
                    {monthItem.data.length > 0 ? (
                      monthItem.data.map((day, idx) => (
                        <div
                          key={idx}
                          className={`p-3 border rounded text-center text-sm ${
                            day.visit
                              ? "bg-green-500 text-white"
                              : "bg-gray-100"
                          }`}
                        >
                          <div className="font-semibold">{day.date}</div>
                          <div className="text-xs mt-1 text-red-600">
                            {day.visit ? formatTimeAMPM(day?.record?.visitingDate+":"+day?.record?.visitingTime):""}
                          </div>

                        </div>
                      ))
                    ) : (
                      <div className="col-span-7 text-center text-gray-500 py-4">
                        No data available for this month
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* LOADER */}
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

export default VisitingLogModal;
