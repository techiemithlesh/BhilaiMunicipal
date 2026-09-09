import axios from "axios";
import { debounce } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import Select from "react-select";
import { safApplicationSearch } from "../../../api/endpoints";
import SearchWithTable from "../../../components/common/SearchWithTable";
import { fetchWardList } from "../../../store/slices/wardSlice";
import { getToken } from "../../../utils/auth";

const SAFList = () => {
    const dispatch = useDispatch();
    const [keyword, setKeyword] = useState("");
    const [wardIds, setWardIds] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSearchTriggered, setIsSearchTriggered] = useState(false); 

    const { wardList = [] } = useSelector((state) => state.ward);

    useEffect(() => {
        dispatch(fetchWardList());
    }, [dispatch]);

    const debouncedSearch = useCallback(
        debounce(async (currentWardIds, currentKeyword, page, perPage) => {
            setIsLoading(true);
            try {
                const response = await axios.post(
                    safApplicationSearch,
                    { 
                        wardId: currentWardIds, 
                        keyWord: currentKeyword, 
                        page: page, 
                        perPage: perPage 
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

    const handleSearchSubmit = () => {
      if(!isSearchTriggered){
        setIsSearchTriggered(true);
      }
      setCurrentPage(1);
      debouncedSearch(wardIds, keyword,currentPage, itemsPerPage);
    };

    useEffect(() => {
      if (isSearchTriggered) {
        debouncedSearch(wardIds, keyword,currentPage, itemsPerPage);
      }
    }, [currentPage,itemsPerPage]);

    const wardOptions = wardList.map((w) => ({
        value: w.id,
        label: w.wardNo,
    }));
    
    const selectedWardOptions = wardOptions.filter((opt) => wardIds.includes(opt.value));


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
                            isMulti
                            options={wardOptions}
                            value={selectedWardOptions}
                            onChange={(selectedOptions) =>
                                setWardIds(selectedOptions.map((opt) => opt.value))
                            }
                            placeholder="Select Ward(s)..."
                            className="text-sm min-w-[200px]"
                        />
                    ),
                },
                {
                    label: "Enter Keywords",
                    type: "text",
                    value: keyword,
                    onChange: setKeyword, 
                    placeholder: "Enter SAF No, Owner Name, etc.",
                },
            ]}
            onSearchSubmit={handleSearchSubmit}

            tableHeaders={[
                "#", "Ward No.", "SAF No.", "Owner Name", 
                "Guardian Name", "Mobile No", "Property Type", "Assessment Type", 
                "Apply Date", "Address", "Status", "View",
            ]}
            tableData={tableData}
            renderRow={(row, index) => (
                <tr key={row.id || index}> 
                    <td className="px-3 py-2 border">{index + 1}</td>
                    <td className="px-3 py-2 border">{row.wardNo ?? ""}</td>
                    <td className="px-3 py-2 border">{row.safNo}</td>
                    <td className="px-3 py-2 border">{row.ownerName ?? ""}</td>
                    <td className="px-3 py-2 border">{row.guardianName ?? ""}</td>
                    <td className="px-3 py-2 border">{row.mobileNo ?? ""}</td>
                    <td className="px-3 py-2 border">{row.propertyType ?? ""}</td>
                    <td className="px-3 py-2 border">{row.assessmentType ?? ""}</td>
                    <td className="px-3 py-2 border">{row.applyDate ?? ""}</td>
                    <td className="px-3 py-2 border">{row.propAddress ?? "NA"}</td>
                    <td className="px-3 py-2 border text-xs">{row.appStatus ?? "NA"}</td>
                    <td className="px-3 py-2 border">
                        <Link
                            to={`/saf/details/${row.safDtlId}`}
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

export default SAFList;