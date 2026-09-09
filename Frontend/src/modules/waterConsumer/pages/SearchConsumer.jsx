import { debounce } from "lodash";
import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import Select from "react-select";
import { waterConsumerSearchApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { fetchWardList } from "../../../store/slices/wardSlice";

function SearchConsumer() {
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

  // Use useCallback with correct dependencies to ensure debounced function uses latest state
  const debouncedSearch = useCallback(
    debounce(async (wardIds, currentKeyword, page, perPage) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          waterConsumerSearchApi,
          {
            wardId: wardIds,
            keyWord: currentKeyword,
            page: page,
            perPage: perPage,
          },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const { data } = response.data;
        setTableData(data.data);
        setTotalPages(data.lastPage);
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

  useEffect(() => {
    if (isSearchTriggered) {
      debouncedSearch(wardId, keyword, currentPage, itemsPerPage);
    }
  }, [currentPage, itemsPerPage]);

  const handleSearch = () => {
    if (!isSearchTriggered) {
      setIsSearchTriggered(true);
    }
    setCurrentPage(1);
    debouncedSearch(wardId, keyword, currentPage, itemsPerPage);
  };

  return (
    <SearchWithTable
      filterType="Search Application"
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
              aria-label="Ward No."
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
          placeholder: "Enter Consumer No, Owner Name, etc.",
        },
      ]}
      onSearchSubmit={handleSearch}
      tableHeaders={[
        "#",
        "Ward No.",
        "Consumer No.",
        "Holding No.",
        "SAF No.",
        "Owner Name",
        "Guardian Name",
        "Mobile No",
        "Apply Date",
        "Address",
        "View",
      ]}
      tableData={tableData}
      renderRow={(row, index) => (
        <tr key={row.id}>
          <td className="px-3 py-2 border">{index + 1}</td>
          <td className="px-3 py-2 border">{row.wardNo ?? ""}</td>
          <td className="px-3 py-2 border">{row.consumerNo}</td>
          <td className="px-3 py-2 border">{row.newHoldingNo}</td>
          <td className="px-3 py-2 border">{row.safNo}</td>
          <td className="px-3 py-2 border">{row.ownerName ?? ""}</td>
          <td className="px-3 py-2 border">{row.guardianName ?? ""}</td>
          <td className="px-3 py-2 border">{row.mobileNo ?? ""}</td>
          <td className="px-3 py-2 border">{row.applyDate ?? ""}</td>
          <td className="px-3 py-2 border">{row.address ?? "NA"}</td>
          <td className="px-3 py-2 border">
            <Link
              to={`/water/consumer/detail/${row.id}`}
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

export default SearchConsumer;
