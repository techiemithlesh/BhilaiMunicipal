import { useDispatch, useSelector } from "react-redux";
import { debounce } from "lodash";
import AdminLayout from "../../../layout/AdminLayout";
import { useCallback, useEffect, useState } from "react";
import { searchTradeApi } from "../../../api/endpoints";
import { fetchWardList } from "../../../store/slices/wardSlice";
import SearchWithTable from "../../../components/common/SearchWithTable";
import toast from "react-hot-toast";
import { Select } from "@nextui-org/react";
import axios from "axios";
import { getToken } from "../../../utils/auth";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const ApplicationSearch = () => {
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [wardId, setWardId] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);

  const { wardList = [], loading, error } = useSelector((state) => state.ward);

  useEffect(() => {
    dispatch(fetchWardList());
  }, [dispatch]);

  const debouncedSearch = useCallback(
    debounce(async (wardIds, keyword, page, perPage) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          searchTradeApi,
          { wardId: wardIds, keyWord: keyword, page: page, perPage: perPage },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const { data } = response.data;
        if (response.data.status === true) {
          toast.success(response.data.message, {
            position: 'top-right'
          });
          setTableData(data.data);
          setTotalPages(data.lastPage);
        }
      } catch (error) {
        console.error("Search failed", error);
        setTableData([]);
        setTotalPages();
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  const handleSearch = () => {
    if (!isSearchTriggered) {
      setIsSearchTriggered(true);
    }
    setCurrentPage(1);
    debouncedSearch(wardId, keyword, currentPage, itemsPerPage);
  };

  useEffect(() => {
    if (isSearchTriggered) {
      debouncedSearch(wardId, keyword, currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  return (
    <>
      <SearchWithTable
        title="Search Applicant"
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        loading={isLoading}
        setPageNo={setCurrentPage}
        setItemsPerPage={setItemsPerPage}
        filters={[
          {
            label: "Ward No.",
            type: "custom",
            render: () => (
              <Select
                isMulti
                options={wardList.map((w) => ({
                  value: w.id,
                  label: w.wardNo,
                }))}
                value={wardList
                  .filter((w) => wardId.includes(w.id))
                  .map((w) => ({ value: w.id, label: w.wardNo }))}
                onChange={(selectedOptions) =>
                  setWardId(selectedOptions.map((opt) => opt.value))
                }
                placeholder="Select Ward(s)..."
                className="text-sm"
              />
            ),
          },
          {
            label: "Enter Keywords",
            type: "text",
            value: keyword,
            onChange: setKeyword,
            placeholder: "Enter Application No, Owner Name, etc.",
          },
        ]}
        onSearchSubmit={handleSearch}
        tableHeaders={[
          "#",
          "Ward No.",
          "Application No.",
          "Firm Name",
          "Owner Name",
          "Address",
          "Apply Date",
          "App Status",
          "View",
        ]}
        tableData={tableData}
        renderRow={(row, index) => (
          <tr key={row.id}>
            <td className="px-3 py-2 border">{index + 1}</td>
            <td className="px-3 py-2 border">{row.wardNo ?? ""}</td>
            <td className="px-3 py-2 border">{row.applicationNo ?? ""}</td>
            <td className="px-3 py-2 border">{row.firmName ?? ""}</td>
            <td className="px-3 py-2 border">{row.ownerName ?? ""}</td>
            <td className="px-3 py-2 border">{row.address ?? ""}</td>
            <td className="px-3 py-2 border">{row.applyDate ?? ""}</td>
            <td className="px-3 py-2 border">{row.appStatus ?? ""}</td>
            <td className="px-3 py-2 border">
              <Link
                to={`/trade/details/${row.id}`}
                rel="noopener noreferrer"
                className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
              >
                <FaEye className="w-5 h-5" />
              </Link>
            </td>
          </tr>
        )}
      />
    </>
  );
};

export default ApplicationSearch;
