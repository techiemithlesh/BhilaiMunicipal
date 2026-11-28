import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Select from "react-select";
import { FaEye } from "react-icons/fa";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { useLoading } from "../../../contexts/LoadingContext";
import { getWardListApi, leaseMasterDataApi, leaseSearchApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";

const toList = (value) =>
  Array.isArray(value) ? value : Object.values(value || {});

const SearchDtl = () => {
  const token = getToken();
  const { setIsLoadingGable } = useLoading();

  const [wardList, setWardList] = useState([]);
  const [areaList, setAreaList] = useState([]);

  const [wardId, setWardId] = useState([]);
  const [areaId, setAreaId] = useState("");
  const [keyword, setKeyword] = useState("");

  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchTriggered, setIsSearchTriggered] = useState(false);

  // -------------------- Master data --------------------
  useEffect(() => {
    (async () => {
      setIsLoadingGable(true);
      try {
        const res = await axios.post(
          leaseMasterDataApi,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res?.data?.status) {
          setWardList(toList(res.data.data?.wardList));
          setAreaList(toList(res.data.data?.areaType));
        }
      } catch {
        try {
          const wardRes = await axios.get(getWardListApi, {
            headers: { Authorization: `Bearer ${token}` },
            params: { all: true },
          });
          if (wardRes?.data?.status) {
            setWardList(toList(wardRes.data.data));
          }
        } catch (error) {
          console.error("Error fetching lease rent master data:", error);
          toast.error("Unable to load master data.");
        }
      } finally {
        setIsLoadingGable(false);
      }
    })();
  }, []);

  // -------------------- Search --------------------
  const fetchResults = async (page, perPage) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        leaseSearchApi,
        {
          wardId,
          areaId: areaId || null,
          keyWord: keyword.trim() || null,
          page,
          perPage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.status) {
        const result = res.data.data || {};
        setTableData(toList(result.data));
        setTotalPages(result.lastPage || 1);
        setTotalItems(result.total || 0);
      } else {
        toast.error(res?.data?.message || "Unable to search lease holders.");
        setTableData([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Lease rent search failed", error);
      const reason = error?.response
        ? `HTTP ${error.response.status}`
        : error?.message || "no response from server";
      toast.error(`Unable to search lease holders (${reason}).`);
      setTableData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setIsSearchTriggered(true);
    setCurrentPage(1);
    fetchResults(1, itemsPerPage);
  };

  useEffect(() => {
    if (isSearchTriggered) fetchResults(currentPage, itemsPerPage);
  }, [currentPage, itemsPerPage]);

  return (
    <SearchWithTable
      title="Search Lease Holder"
      loading={isLoading}
      itemsPerPage={itemsPerPage}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      setPageNo={setCurrentPage}
      setItemsPerPage={setItemsPerPage}
      onSearchSubmit={handleSearch}
      filters={[
        {
          label: "Ward No.",
          type: "custom",
          render: () => (
            <Select
              aria-label="Ward No."
              isMulti
              options={wardList.map((w) => ({ value: w.id, label: w.wardNo }))}
              value={wardList
                .filter((w) => wardId.includes(w.id))
                .map((w) => ({ value: w.id, label: w.wardNo }))}
              onChange={(selected) => setWardId((selected || []).map((o) => o.value))}
              placeholder="Select Ward(s)..."
              className="text-sm"
            />
          ),
        },
        {
          label: "Lease Area",
          type: "select",
          value: areaId,
          onChange: setAreaId,
          placeholder: "All Areas",
          options: areaList.map((a) => ({ value: a.id, label: a.areaName })),
        },
        {
          label: "Enter Keywords",
          type: "text",
          value: keyword,
          onChange: setKeyword,
          placeholder: "Consumer No, Nigam Lease No, Consumer Name, Mobile No",
        },
      ]}
      tableHeaders={[
        "#",
        "Ward No.",
        "Lease No.",
        "Nigam Lease No.",
        "Consumer Name",
        "Mobile No",
        "Area Name",
        "Use of Land",
        "Amnt",
        "Start Date",
        "End Date",
        "Address",
        "Status",
        "View",
      ]}
      tableData={tableData}
      renderRow={(row, index) => (
        <tr key={row.id ?? index}>
          <td className="px-3 py-2 border">{index + 1}</td>
          <td className="px-3 py-2 border">{row.wardNo ?? ""}</td>
          <td className="px-3 py-2 border">{row.leaseNo ?? ""}</td>
          <td className="px-3 py-2 border">{row.nigamLeaseNo ?? row.regNo ?? ""}</td>
          <td className="px-3 py-2 border">{row?.ownerName}</td>
          <td className="px-3 py-2 border">{row.mobileNo ?? ""}</td>
          <td className="px-3 py-2 border">{row.areaName ?? ""}</td>
          <td className="px-3 py-2 border">{row.usageType ?? ""}</td>
          <td className="px-3 py-2 border">{row.yearlyRate ?? ""}</td>
          <td className="px-3 py-2 border">{row.leaseDate ?? ""}</td>
          <td className="px-3 py-2 border">{row.leaseEndDate ?? ""}</td>
          <td className="px-3 py-2 border">{row.address ?? ""}</td>
          <td className="px-3 py-2 border">{row.statusType ?? ""}</td>
          <td className="px-3 py-2 border">
            <Link
              to={`/lease/dtl/${row.id}`}
              className="inline-flex justify-center items-center text-blue-600 hover:text-blue-800"
              title="View Details"
            >
              <FaEye className="w-5 h-5" />
            </Link>
          </td>
        </tr>
      )}
    />
  );
};

export default SearchDtl;
