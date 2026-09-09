import { useEffect, useState } from "react";
import SearchWithTable from "../../components/common/SearchWithTable";
import { getToken } from "../../utils/auth";
import axios from "axios";
import {
  ModuleListApi,
  searchTransactionApi,
  updatePaymentModeApi,
} from "../../api/endpoints"; // Assuming chequeReconciliationApi is imported
import { Button, Spinner } from "@nextui-org/react";
import { formatLocalDate, toTitleCase } from "../../utils/common";
import { FaEye } from "react-icons/fa";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { modalVariants } from "../../utils/motionVariable";
import toast from "react-hot-toast";

function UpdatePaymentMode() {
  const [moduleList, setModuleList] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [tranNo, setTranNo] = useState("");
  const [tableData, setTableData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [error, setError] = useState([]);
  const [paymentModeForm, setPaymentModeForm] = useState({});
  const [paymentFormError, setPaymentFormError] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [selectedTran, setSelectedTran] = useState(null);

  const token = getToken();

  const handleSearch = async () => {
    setIsLoading(true);
    setError([]);
    try {
      const response = await axios.post(
        searchTransactionApi,
        { tranNo, moduleId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setTableData(data);
      } else if (response?.data?.errors) {
        setError(response?.data?.errors);
      }
    } catch (err) {
      console.error("Error fetching reconciliation list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModule = async () => {
    try {
      const response = await axios.post(
        ModuleListApi,
        { all: "all" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        setModuleList(response?.data?.data);
      }
    } catch (err) {
      console.error("Error fetching module list:", err);
    }
  };

  useEffect(() => {
    fetchModule();
  }, [token]);

  const modules = moduleList.map((item) => ({
    value: item.id,
    label: item.moduleName,
  }));
  const isModalFormValid = () => {
    const { paymentMode, chequeNo, chequeDate, bankName, branchName } =
      paymentModeForm;
    if (!paymentMode) return false;
    if (paymentMode != "CASH") {
      if (!chequeNo || !chequeDate || !bankName || !branchName) return false;
    }

    return true;
  };

  const handelChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    if (type == "checkbox") {
      newValue = checked;
    }
    setPaymentModeForm((prev) => {
      let updated = { ...prev, [name]: newValue };
      if (name == "paymentMode" && value == "CASH") {
        updated = {
          ...updated,
          chequeDate: "",
          chequeNo: "",
          bankName: "",
          branchName: "",
        };
      }
      return updated;
    });
    if (paymentFormError && paymentFormError[name]) {
      setPaymentFormError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  // ----------------------------------------

  const handleProceed = async () => {
    if (!isModalFormValid()) {
      toast.error("Please fill all required fields.");
      return;
    }

    const payload = {
      moduleId: moduleId,
      tranId: selectedTran?.id,
      ...paymentModeForm,
    };

    setIsFrozen(true);
    try {
      const response = await axios.post(updatePaymentModeApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data?.status) {
        toast.success(response?.data?.message);
        onClose();
        handleSearch(); // Refresh the table after update
      } else if (response?.data?.errors) {
        toast.error(response?.data?.message || "Validation Error");
        setPaymentFormError(response?.data?.errors);
      } else {
        toast.error(response?.data?.message || "An unknown error occurred.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An API error occurred.");
    } finally {
      setIsFrozen(false);
    }
  };

  const onClose = () => {
    setIsModelOpen(false);
    setSelectedTran(null);
  };

  return (
    <>
      <SearchWithTable
        title="💳 Update Payment Mode"
        isPaginate={false}
        filters={[
          {
            label: "Transaction No",
            type: "text",
            value: tranNo,
            onChange: setTranNo,
            error: error?.tranNo,
          },
          {
            label: "Module",
            type: "select",
            options: [{ value: "", label: "--ALL--" }, ...modules],
            value: moduleId,
            onChange: setModuleId,
            error: error?.moduleId,
          },
        ]}
        onSearchSubmit={handleSearch}
        tableHeaders={[
          "#",
          "User Name",
          "Application Type.",
          "Application No.",
          "Transaction No.",
          "Tran Date",
          "Payment Mode",
          "Transaction Type",
          "Cheque Date",
          "Cheque No",
          "Bank Name",
          "Branch Name",
          "Tran Amount",
          "Action",
        ]}
        tableData={tableData}
        renderRow={(row, index) => (
          <tr key={row?.id} className={`hover:bg-gray-50 transition`}>
            <td className="px-3 py-2 border text-center">{index + 1}</td>
            <td className="px-3 py-2 border">{row?.userName}</td>
            <td className="px-3 py-2 border">{row?.appTyp}</td>
            <td className="px-3 py-2 border">{row?.appNo}</td>
            <td className="px-3 py-2 border">{row?.tranNo}</td>
            <td className="px-3 py-2 border">
              {formatLocalDate(row?.tranDate)}
            </td>
            <td className="px-3 py-2 border">{row?.paymentMode}</td>
            <td className="px-3 py-2 border">{row?.tranType}</td>
            <td className="px-3 py-2 border">{row?.chequeDate}</td>
            <td className="px-3 py-2 border">{row?.chequeNo}</td>
            <td className="px-3 py-2 border">{row?.bankName}</td>
            <td className="px-3 py-2 border">{row?.branchName}</td>
            <td className="px-3 py-2 border font-semibold text-green-600">
              ₹{row?.payableAmt}
            </td>
            <td className="px-3 py-2 border text-center">
              <Button
                isIconOnly
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => {
                  setSelectedTran(row);
                  setPaymentModeForm({
                    paymentMode: row?.paymentMode || "",
                    chequeNo: row?.chequeNo || "",
                    chequeDate: row?.chequeDate || "",
                    bankName: row?.bankName || "",
                    branchName: row?.branchName || "",
                  });
                  setIsModelOpen(true);
                }}
              >
                <FaEye className="w-5 h-5" />
              </Button>
            </td>
          </tr>
        )}
      />

      {/* Cheque Clearance Modal */}
      {isModelOpen && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-40 p-4">
          {isLoading ? (
            <Spinner />
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={modalVariants}
              transition={{ duration: 0.3 }}
              className="flex flex-col bg-white shadow-xl p-6 rounded-xl w-full max-w-6xl max-h-[95vh]"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="font-bold text-blue-600 text-lg">
                  Update Mode{" "}
                  {selectedTran?.tranNo ? "[" + selectedTran?.tranNo + "]" : ""}
                </h2>
                <button onClick={onClose}>
                  <FaTimes
                    size={20}
                    className="text-gray-500 hover:text-red-500"
                  />
                </button>
              </div>
              <div className="relative flex-grow pr-2 overflow-y-auto">
                <div
                  className={`${
                    isFrozen ? "pointer-events-none filter blur-sm" : ""
                  } w-full space-y-4`}
                >
                  <div className="gap-4 grid grid-cols-4">
                    {selectedTran && (
                      <>
                        {/* Display current transaction details */}
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">
                            Payment Mode
                          </div>
                          <div className="font-bold">
                            {selectedTran.paymentMode}
                          </div>
                        </div>
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Amount</div>
                          <div className="font-bold">
                            ₹{selectedTran.payableAmt}
                          </div>
                        </div>
                        {selectedTran.paymentMode != "CASH" && (
                          <>
                            <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                              <div className="text-gray-500 text-sm">
                                {toTitleCase(selectedTran.paymentMode)} No
                              </div>
                              <div className="font-bold">
                                {selectedTran.chequeNo}
                              </div>
                            </div>
                            <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                              <div className="text-gray-500 text-sm">
                                {toTitleCase(selectedTran.paymentMode)} Date
                              </div>
                              <div className="font-bold">
                                {formatLocalDate(selectedTran.chequeDate)}
                              </div>
                            </div>
                            <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                              <div className="text-gray-500 text-sm">
                                Bank Name
                              </div>
                              <div className="font-bold">
                                {selectedTran.bankName}
                              </div>
                            </div>
                            <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                              <div className="text-gray-500 text-sm">
                                Branch Name
                              </div>
                              <div className="font-bold">
                                {selectedTran.branchName}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="gap-4 grid grid-cols-4">
                    <div>
                      <label className="block mb-2 font-semibold text-sm">
                        Payment Mode <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 w-full"
                        value={paymentModeForm.paymentMode || ""}
                        name="paymentMode"
                        onChange={handelChange}
                        disabled={isFrozen}
                      >
                        <option value="">-- Select --</option>
                        <option value="CASH">CASH</option>
                        <option value="CHEQUE">CHEQUE</option>
                        <option value="DD">DD</option>
                        <option value="NEFT">NEFT</option>
                      </select>
                      {paymentFormError?.paymentMode && (
                        <span className="text-red-400 text-sm">
                          {paymentFormError?.paymentMode}
                        </span>
                      )}
                    </div>

                    {paymentModeForm?.paymentMode &&
                      paymentModeForm.paymentMode != "CASH" && (
                        <>
                          <div className="mb-4">
                            <label className="block mb-1 font-semibold text-sm">
                              {toTitleCase(paymentModeForm.paymentMode)} No.{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="chequeNo"
                              value={paymentModeForm.chequeNo || ""}
                              onChange={handelChange}
                              className="p-2 border rounded w-full"
                              placeholder={`Enter ${toTitleCase(
                                paymentModeForm.paymentMode
                              )} No`}
                              required
                              disabled={isFrozen}
                            />
                            {paymentFormError?.chequeNo && (
                              <span className="text-red-400 text-sm">
                                {paymentFormError?.chequeNo}
                              </span>
                            )}
                          </div>
                          <div className="mb-4">
                            <label className="block mb-1 font-semibold text-sm">
                              {toTitleCase(paymentModeForm.paymentMode)} Date
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={paymentModeForm?.chequeDate || ""}
                              max={new Date().toISOString().split("T")[0]}
                              name="chequeDate"
                              onChange={handelChange}
                              className="p-2 border rounded w-full"
                              required
                              disabled={isFrozen}
                            />
                            {paymentFormError?.chequeDate && (
                              <span className="text-red-400 text-sm">
                                {paymentFormError?.chequeDate}
                              </span>
                            )}
                          </div>
                          <div className="mb-4">
                            <label className="block mb-1 font-semibold text-sm">
                              Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={paymentModeForm.bankName || ""}
                              name="bankName"
                              onChange={handelChange}
                              className="p-2 border rounded w-full"
                              placeholder="Enter Bank Name"
                              required
                              disabled={isFrozen}
                            />
                            {paymentFormError?.bankName && (
                              <span className="text-red-400 text-sm">
                                {paymentFormError?.bankName}
                              </span>
                            )}
                          </div>
                          <div className="mb-4">
                            <label className="block mb-1 font-semibold text-sm">
                              Branch Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={paymentModeForm.branchName || ""}
                              name="branchName"
                              onChange={handelChange}
                              className="p-2 border rounded w-full"
                              placeholder="Enter Branch Name"
                              required
                              disabled={isFrozen}
                            />
                            {paymentFormError?.branchName && (
                              <span className="text-red-400 text-sm">
                                {paymentFormError?.branchName}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                  </div>
                </div>

                {isFrozen && (
                  <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 rounded">
                    <Spinner label="Processing..." color="primary" />
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t">
                <Button
                  color="primary"
                  className="px-6"
                  isDisabled={!isModalFormValid() || isFrozen}
                  onPress={handleProceed}
                  isLoading={isFrozen}
                >
                  Proceed
                </Button>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                  disabled={isFrozen}
                  className="ml-3"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </>
  );
}

export default UpdatePaymentMode;
