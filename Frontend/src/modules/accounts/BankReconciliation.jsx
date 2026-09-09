import { useState, useEffect } from "react";
import SearchWithTable from "../../components/common/SearchWithTable";
import { FaEye } from "react-icons/fa";
import { Button, Spinner } from "@nextui-org/react";
import {
  chequeReconciliationApi,
  chequeReconciliationListApi,
  ModuleListApi,
} from "../../api/endpoints";
import axios from "axios";
import { getToken } from "../../utils/auth";
import { formatLocalDate, toTitleCase } from "../../utils/common";
import { motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { modalVariants } from "../../utils/motionVariable";
import toast from "react-hot-toast";

export default function BankReconciliation() {
  const token = getToken();
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [uptoDate, setUptoDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [moduleList, setModuleList] = useState([]);
  const [moduleId, setModuleId] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [chequeNo, setChequeNo] = useState("");
  const [tableData, setTableData] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  const [selectedCheque, setSelectedCheque] = useState(null);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);
  const [error, setError] = useState([]);
  const [bankResponseForm, setBankResponseForm] = useState({});
  const [bankFormError, setBankFormError] = useState([]);
  const [isModelOpen, setIsModelOpen] = useState(false);

  const handleSearch = async () => {
    if (!isSearchTriggered) {
      setIsSearchTriggered(true);
    }
    setIsLoading(true);
    setError([]);
    try {
      const response = await axios.post(
        chequeReconciliationListApi,
        {
          fromDate,
          uptoDate,
          moduleId,
          verificationStatus,
          paymentMode,
          chequeNo,
          page: currentPage,
          perPage: itemsPerPage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.data?.status) {
        const data = response?.data?.data;
        setTableData(data?.data);
        setTotalPages(data?.lastPage || 1);
      } else if (response?.data?.errors) {
        setError(response?.data?.errors);
      }
    } catch (err) {
      console.error("Error fetching reconciliation list:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModule();
  }, [token]);

  useEffect(() => {
    if (isSearchTriggered) {
      handleSearch();
    }
  }, [currentPage, itemsPerPage]);

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

  const modules = moduleList.map((item) => ({
    value: item.id,
    label: item.moduleName,
  }));

  const handelChange = (e) => {
    const { name, value, type, checked } = e.target;
    let newValue = value;
    if (type === "checkbox") {
      newValue = checked;
    }
    setBankResponseForm((prev) => {
      let updated = { ...prev, [name]: value };
      if (name == "verificationStatus" && value != "BOUNCED") {
        updated = { ...updated, bounceAmount: "", remarks: "" };
      }
      return updated;
    });
    if (bankFormError && bankFormError[name]) {
      setBankFormError((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const isModalFormValid = () => {
    const { verificationStatus, clearBounceDate, remarks } = bankResponseForm;
    if (!verificationStatus || !clearBounceDate) return false;
    if (verificationStatus == "BOUNCED" && !remarks) return false;
    return true;
  };

  const handleProceed = async () => {
    if (!isModalFormValid()) return;
    const payload = {
      moduleId: moduleId,
      tranId: selectedCheque?.id,
      ...bankResponseForm,
      bounceAmount:
        bankResponseForm?.verificationStatus == "BOUNCED"
          ? bankResponseForm?.bounceAmount
          : null,
    };

    // This is where you would make your final API call to update the record
    setIsFrozen(true);
    try {
      const response = await axios.post(chequeReconciliationApi, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response?.data?.status) {
        toast.success(response?.data?.message);
        onClose();
        handleSearch(); // Refresh the table after update
      } else if (response?.data?.errors) {
        toast.error(response?.data?.message);
        setBankFormError(response?.data?.errors);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFrozen(false);
    }
  };

  const onClose = () => {
    setIsModelOpen(false);
    setSelectedCheque(null);
  };

  return (
    <>
      <SearchWithTable
        title="💳 Bank Reconciliation"
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={isLoading}
        setPageNo={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
        filters={[
          {
            label: "From Transaction Date",
            type: "date",
            value: fromDate,
            onChange: setFromDate,
            error: error?.fromDate,
          },
          {
            label: "To Transaction Date",
            type: "date",
            value: uptoDate,
            onChange: setUptoDate,
            error: error?.uptoDate,
          },
          {
            label: "Module",
            type: "select",
            options: [{ value: "", label: "--ALL--" }, ...modules],
            value: moduleId,
            onChange: setModuleId,
            error: error?.moduleId,
          },
          {
            label: "Payment Mode",
            type: "select",
            options: [
              { value: "", label: "--ALL--" },
              { value: "CHEQUE", label: "CHEQUE" },
              { value: "DD", label: "DD" },
              { value: "NEFT", label: "NEFT" },
              { value: "RTGS", label: "RTGS" },
            ],
            value: paymentMode,
            onChange: setPaymentMode,
            error: error?.paymentMode,
          },
          {
            label: "Verification Status",
            type: "select",
            options: [
              { value: "", label: "--ALL--" },
              { value: "PENDING", label: "PENDING" },
              { value: "CLEAR", label: "CLEAR" },
              { value: "BOUNCEDD", label: "BOUNCEDD" },
            ],
            value: verificationStatus,
            onChange: setVerificationStatus,
            error: error?.verificationStatus,
          },
          {
            label: "Cheque No.",
            type: "text",
            value: chequeNo,
            onChange: setChequeNo,
            placeholder: "Enter cheque no.",
            error: error?.chequeNo,
          },
        ]}
        onSearchSubmit={handleSearch}
        tableHeaders={[
          "#",
          "Tran No.",
          "Tran Date",
          "Payment Mode",
          "Transaction Type",
          "Cheque Date",
          "Cheque No",
          "Bank Name",
          "Branch Name",
          "Tran Amount",
          "Clearance Date",
          "Remarks",
          "TC Name",
          "Action",
        ]}
        tableData={tableData}
        renderRow={(row, index) => {
          let color =
            row?.paymentStatus == 1
              ? "text-green-400"
              : row?.paymentStatus == 3
              ? "text-red-400"
              : "";
          return (
            <tr
              key={row?.id}
              className={`hover:bg-gray-50 transition ${color}`}
            >
              <td className="px-3 py-2 border text-center">
                {index + 1 + (currentPage - 1) * itemsPerPage}
              </td>
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
              <td className="px-3 py-2 border">
                {formatLocalDate(row?.clearBounceDate)}
              </td>
              <td className="px-3 py-2 border text-gray-500 italic">
                {row?.remarks}
              </td>
              <td className="px-3 py-2 border">{row?.userName}</td>
              <td className="px-3 py-2 border text-center">
                {row?.paymentStatus == 2 && (
                  <Button
                    isIconOnly
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => {
                      setSelectedCheque(row);
                      setBankResponseForm({});
                      setIsModelOpen(true);
                    }}
                  >
                    <FaEye className="w-5 h-5" />
                  </Button>
                )}
              </td>
            </tr>
          );
        }}
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
                  Bank Reconciliation
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
                    {selectedCheque && (
                      <>
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Cheque No</div>
                          <div className="font-bold">
                            {selectedCheque.chequeNo}
                          </div>
                        </div>
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Amount</div>
                          <div className="font-bold">
                            ₹{selectedCheque.payableAmt}
                          </div>
                        </div>
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Bank Name</div>
                          <div className="font-bold">
                            {selectedCheque.bankName}
                          </div>
                        </div>
                        <div className="bg-gray-50 shadow-sm p-3 rounded-lg">
                          <div className="text-gray-500 text-sm">Bank Name</div>
                          <div className="font-bold">
                            {selectedCheque.branchName}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="gap-4 grid grid-cols-4">
                    <div>
                      <label className="block mb-2 font-semibold text-sm">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 w-full"
                        value={bankResponseForm.verificationStatus}
                        name="verificationStatus"
                        onChange={handelChange}
                        disabled={isFrozen}
                      >
                        <option value="">-- Select --</option>
                        <option value="CLEAR">Clear</option>
                        <option value="BOUNCED">Bounce</option>
                      </select>
                      {bankFormError?.verificationStatus && (
                        <span className="text-red-400 text-sm">
                          {bankFormError?.verificationStatus}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 font-semibold text-sm">
                        {toTitleCase(selectedCheque?.paymentMode)}{" "}
                        {toTitleCase(
                          bankResponseForm.verificationStatus || "Clear"
                        )}{" "}
                        Date<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={bankResponseForm.clearBounceDate}
                        max={new Date().toISOString().split("T")[0]}
                        name="clearBounceDate"
                        onChange={handelChange}
                        className="p-2 border rounded w-full"
                        required
                        disabled={isFrozen}
                      />
                      {bankFormError?.clearBounceDate && (
                        <span className="text-red-400 text-sm">
                          {bankFormError?.clearBounceDate}
                        </span>
                      )}
                    </div>
                    {/* If Bounce */}
                    {bankResponseForm.verificationStatus === "BOUNCED" && (
                      <>
                        <div className="mb-4">
                          <label className="block mb-1 font-semibold text-sm">
                            Cancellation Charge{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            name="bounceAmount"
                            value={bankResponseForm.bounceAmount}
                            onChange={handelChange}
                            className="p-2 border rounded w-full"
                            placeholder="Enter amount"
                            required
                            disabled={isFrozen}
                          />
                          {bankFormError?.bounceAmount && (
                            <span className="text-red-400 text-sm">
                              {bankFormError?.bounceAmount}
                            </span>
                          )}
                        </div>
                        <div className="mb-4">
                          <label className="block mb-1 font-semibold text-sm">
                            Remarks <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={bankResponseForm.remarks}
                            name="remarks"
                            onChange={handelChange}
                            className="p-2 border rounded w-full"
                            placeholder="Enter reason"
                            required
                            disabled={isFrozen}
                          />
                          {bankFormError?.remarks && (
                            <span className="text-red-400 text-sm">
                              {bankFormError?.remarks}
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
