import { useDispatch, useSelector } from "react-redux";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { useCallback, useEffect, useState } from "react";
import { fetchWardList } from "../../../store/slices/wardSlice";
import { debounce } from "lodash";
import axios from "axios";
import { propertySearchApi } from "../../../api/endpoints";
import Select from "react-select";
import { getToken } from "../../../utils/auth";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const PropertyListPage = () => {
  const dispatch = useDispatch();
  const [keyword, setKeyword] = useState("");
  const [wardId, setWardId] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
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
          propertySearchApi,
          { wardId: wardIds, keyWord: keyword, page: page, perPage: perPage },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        const { data } = response.data;
        // console.error("data org", data);
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

  console.log("data", tableData);

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
              name="Ward No."
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
          placeholder: "Enter Holding No, Owner Name, Address, etc.",
        },
      ]}
      onSearchSubmit={handleSearch}
      tableHeaders={[
        "#",
        "Ward No.",
        "Holding No.",
        "New Holding No.",
        "Owner Name",
        "Address",
        "Mobile No",
        "Khata No.",
        "Plot No.",
        "View",
      ]}
      tableData={tableData}
      renderRow={(row, index) => (
        <tr key={row.id}>
          <td className="px-1 py-1 border text-center leading-4">
            {index + 1}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.wardNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.holdingNo}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.newHoldingNo}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.ownerName ?? ""}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.propAddress ?? "NA"}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.mobileNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.khataNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            {row.plotNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center leading-4">
            <Link
              to={`/property/details/${row.id}`}
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
};

export default PropertyListPage;
