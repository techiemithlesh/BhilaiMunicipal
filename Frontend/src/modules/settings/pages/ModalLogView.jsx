import { useEffect, useState } from "react";
import { getToken } from "../../../utils/auth";
import { modalLogListApi } from "../../../api/endpoints";
import { Spinner } from "@nextui-org/react";
import CommonTable from "../../../components/common/CommonTable";
import axios from "axios";
import toast from "react-hot-toast";

function ModalLogView() {
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [previewPayload, setPreviewPayload] = useState(null);

  const token = getToken();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        modalLogListApi,
        {
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
      const result = response.data?.data || {};
      setDataList(result.data || []);
      setTotalPage(result.lastPage || 1);
      setTotalItem(result.total || 1);
    } catch (error) {
      console.error("Error fetching modal logs:", error);
    } finally {
      setIsLoading(false);
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
    setIsLoading(true);
    try {
      const response = await axios.post(
        modalLogListApi,
        {
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
      return response.data.data?.data || [];
    } catch (error) {
      console.error("Error fetching all logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPayload = (payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload copied!");
  };

  const headers = [
    { label: "#", key: "serial" },
    { label: "Token", key: "token" },
    { label: "User", key: "userName" },
    { label: "User Type", key: "userType" },
    { label: "IP", key: "ipAddress" },
    { label: "Pending", key: "pending" },
    { label: "Reverted", key: "totalReverted" },
    { label: "Changes", key: "modelTable" },
    { label: "URL", key: "url" },
    { label: "Created At", key: "rowCreatedAt" },
    { label: "Payload", key: "payload" },
    { label: "Response", key: "responseBody" },
    { label: "Action", key: "" },
  ];

  const renderRow = (item, index, currentPage, itemsPerPage) => (
    <tr key={index} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * itemsPerPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.token || "—"}</td>
      <td className="px-3 py-2 border">{item.userName || "—"}</td>
      <td className="px-3 py-2 border text-red-600">{item.userType || "—"}</td>
      <td className="px-3 py-2 border">{item.ipAddress || "—"}</td>
      <td className="px-3 py-2 border">{item.pending ?? "—"}</td>
      <td className="px-3 py-2 border">{item.totalReverted ?? "—"}</td>
      <td className="px-3 py-2 border">
        <ul className="text-xs list-disc list-inside">
          {(item.modelTable || []).map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </td>
      <td className="px-3 py-2 border">{item.url || "—"}</td>
      <td className="px-3 py-2 border">{item.rowCreatedAt || "—"}</td>
      <td className="px-3 py-2 border max-w-xs text-xs break-words">
        {item.payload ? (
          <div className="flex flex-col gap-1">
            <div className="truncate">
              {JSON.stringify(item.payload).slice(0, 100)}...
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleCopyPayload(item.payload)}
                className="text-blue-600 text-xs underline"
              >
                Copy
              </button>
              <button
                onClick={() => setPreviewPayload(item.payload)}
                className="text-blue-600 text-xs underline"
              >
                Preview
              </button>
            </div>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 border max-w-xs text-xs break-words">
        {item.responseBody ? (
          <div className="flex flex-col gap-1">
            <div className="truncate">
              {JSON.stringify(item.responseBody).slice(0, 100)}...
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => handleCopyPayload(item.responseBody)}
                className="text-blue-600 text-xs underline"
              >
                Copy
              </button>
              <button
                onClick={() => setPreviewPayload(item.responseBody)}
                className="text-blue-600 text-xs underline"
              >
                Preview
              </button>
            </div>
          </div>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2 border">—</td>
    </tr>
  );

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <CommonTable
            data={dataList}
            headers={headers}
            renderRow={renderRow}
            title="Log List"
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
          {previewPayload && (
            <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Payload Preview</h2>
                  <button
                    onClick={() => setPreviewPayload(null)}
                    className="font-semibold text-red-600"
                  >
                    Close
                  </button>
                </div>
                <pre className="text-sm break-words whitespace-pre-wrap">
                  {JSON.stringify(previewPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default ModalLogView;
