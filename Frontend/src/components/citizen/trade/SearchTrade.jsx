import axios from "axios";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEye } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { searchTradeApi } from "../../../api/endpoints";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { fetchWardList } from "../../../store/slices/wardSlice";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

export default function SearchTrade() {
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [tableData, setTableData] = useState([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);
  const token = useSelector((state) => state.citizenAuth.token);

  useEffect(() => {
    dispatch(fetchWardList());
  }, [dispatch]);

  const debouncedSearch = useCallback(
    debounce(async (keyword, page, perPage) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          searchTradeApi,
          {
            ulbID: ulbId,
            wardId: [],
            keyWord: keyword,
            page: page,
            perPage: perPage,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { data } = response.data;
        if (response.data.status === true) {
          toast.success(response.data.message);
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
    debouncedSearch(keyword, currentPage, itemsPerPage);
  };

  useEffect(() => {
    if (isSearchTriggered) {
      debouncedSearch(keyword, currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  return (
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
              to={`/citizen/trade/search/details/${row.id}`}
              rel="noopener noreferrer"
              className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
            >
              <FaEye className="w-5 h-5" />
            </Link>
          </td>
        </tr>
      )}
    />
  );
}
