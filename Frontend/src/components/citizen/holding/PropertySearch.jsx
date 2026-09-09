import { useDispatch } from "react-redux";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import axios from "axios";
import { citizenPropertySearchApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { Link } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const PropertySearch = () => {
  const dispatch = useDispatch();

  // 🔹 Mandatory Filters
  const [holdingNo, setHoldingNo] = useState("");
  const [mobileNo, setMobileNo] = useState("");

  // 🔹 Validation errors
  const [errors, setErrors] = useState({});

  // 🔹 Table & pagination
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🔹 UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);

  // 🔹 Debounced API call
  const debouncedSearch = useCallback(
    debounce(async (payload) => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          citizenPropertySearchApi,
          payload,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        const resData = response.data?.data;

        // ✅ Normalize response to array
        if (resData && !Array.isArray(resData)) {
          setTableData([resData]);
          setTotalPages(1);
        } else if (Array.isArray(resData)) {
          setTableData(resData);
          setTotalPages(1);
        } else {
          setTableData([]);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Property search failed", error);
        setTableData([]);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // 🔹 Search button click (mandatory validation)
  const handleSearch = () => {
    const newErrors = {};

    if (!holdingNo.trim()) {
      newErrors.holdingNo = "Holding No is required";
    }

    if (!/^\d{4}$/.test(mobileNo)) {
      newErrors.mobileNo = "Enter last 4 digits of mobile number";
    }

    setErrors(newErrors);

    // ❌ Stop search if validation fails
    if (Object.keys(newErrors).length > 0) return;

    if (!isSearchTriggered) setIsSearchTriggered(true);

    setCurrentPage(1);

    debouncedSearch({
      holdingNo,
      mobileNo,
      page: 1,
      perPage: itemsPerPage,
    });
  };

  // 🔹 Pagination auto-search (after first valid search)
  useEffect(() => {
    if (isSearchTriggered) {
      debouncedSearch({
        holdingNo,
        mobileNo,
        page: currentPage,
        perPage: itemsPerPage,
      });
    }
  }, [currentPage, itemsPerPage]);

  return (
    <SearchWithTable
      filterType="Search Property"
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      totalPages={totalPages}
      loading={isLoading}
      setPageNo={setCurrentPage}
      setItemsPerPage={setItemsPerPage}
      onSearchSubmit={handleSearch}
      filters={[
        {
          label: "Holding No *",
          type: "text",
          value: holdingNo,
          onChange: (val) => {
            setHoldingNo(val);
            setErrors((prev) => ({ ...prev, holdingNo: "" }));
          },
          placeholder: "Enter Holding No",
          error: errors.holdingNo,
        },
        {
          label: "Mobile (Last 4 Digits) *",
          type: "text",
          value: mobileNo,
          onChange: (val) => {
            if (/^\d{0,4}$/.test(val)) {
              setMobileNo(val);
              setErrors((prev) => ({ ...prev, mobileNo: "" }));
            }
          },
          placeholder: "XXXX",
          error: errors.mobileNo,
        },
      ]}
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
          <td className="px-1 py-1 border text-center">
            {index + 1}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.wardMstrId ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.holdingNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.newHoldingNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.ownerName ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.propAddress ?? "NA"}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.mobileNo ? String(row.mobileNo) : ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.khataNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            {row.plotNo ?? ""}
          </td>
          <td className="px-1 py-1 border text-center">
            <Link
              to={`/citizen/holding/details/${row?.id}`}
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

export default PropertySearch;
