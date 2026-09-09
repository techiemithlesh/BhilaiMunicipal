import { useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";
import axios from "axios";
import { createSearchParams, Link } from "react-router-dom";
import { FaCheck, FaEye, FaTimes } from "react-icons/fa";
import SearchWithTable from "../../components/common/SearchWithTable";
import { cashUserListApi, userApi } from "../../api/endpoints"; // Removed unused cashUserApi
import { getToken } from "../../utils/auth";
import defaultAvatar from "../../assets/images/default-avatar.jpg";
import ImagePreview from '../../components/common/ImagePreview';

const getTodayDate = () => new Date().toISOString().split("T")[0];

export default function CashVerification() {
    const token = getToken();
    
    const [fromDate, setFromDate] = useState(getTodayDate());
    const [uptoDate, setUptoDate] = useState(getTodayDate());
    const [employeeId, setEmployeeId] = useState("");
    const [employeeList, setEmployeeList] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState("");

    useEffect(() => {
        const fetchUserList = async () => {
            try {
                const response = await axios.get(userApi, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { all: true },
                });
                if (response?.data?.status) setEmployeeList(response.data.data);
            } catch (error) {
                console.error("Error fetching collector list:", error);
            }
        };
        fetchUserList();
    }, [token]);

    
    const handleSearchSubmit = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                cashUserListApi,
                { 
                    fromDate: fromDate, 
                    uptoDate: uptoDate, 
                    userId: employeeId,
                },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            const apiData = response.data.data;
            setTableData(apiData.data || apiData);  
        } catch (error) {
            console.error("Search failed", error);
            setTableData([]);
        } finally {
            setIsLoading(false);
        } 
    };

    const openPreviewModel = (link) => {
        setIsModalPreviewOpen(true);
        setPreviewImg(link || defaultAvatar); 
    };

    const closePreviewModel = () => {
        setIsModalPreviewOpen(false);
        setPreviewImg("");
    };

    const employeeOptions = employeeList.map((emp) => ({
        value: emp.id,
        label: emp.name,
    }));

    return (
        <>
            <SearchWithTable
                title="Cash Verification" 
                loading={isLoading}
                isPaginate={false}                
                filters={[
                    {
                        label: "From Date",
                        type: "date",
                        value: fromDate,
                        onChange: setFromDate,
                        placeholder: "Select From Date...",
                    },
                    {
                        label: "Upto Date",
                        type: "date",
                        value: uptoDate,
                        onChange: setUptoDate,
                        placeholder: "Select Upto Date...",
                    },
                    {
                        label: "Employee Name*",
                        type: "select",
                        placeholder: "Select Employee...",
                        options: employeeOptions,
                        value: employeeId,
                        onChange: (value) => setEmployeeId(value),
                    },
                ]}
                onSearchSubmit={handleSearchSubmit} 
                tableHeaders={[
                    "#", "Employee Name", "Property", "GB SAF", "Water", "Trade", 
                    "Total Amount", "Status", "Verified Amount", "Action",
                ]}
                tableData={tableData}
                renderRow={(row, index) => (
                    <tr key={row.id || index}>
                        <td className="px-3 py-2 border">{index + 1}</td>
                        <td className="px-3 py-2 border flex items-center">
                            <img
                                src={row?.userImg || defaultAvatar}
                                alt="userImage"
                                onClick={() => openPreviewModel(row?.userImg)}
                                className="inline-block w-10 h-10 rounded-full object-cover border border-gray-300 cursor-pointer mr-3"
                            />
                            {row.name ?? ""}
                        </td>
                        <td className="px-3 py-2 border">{row.propertyAmount ?? 0}</td>
                        <td className="px-3 py-2 border">{row.gbSaf ?? 0}</td>
                        <td className="px-3 py-2 border">{row.waterAmount ?? 0}</td>
                        <td className="px-3 py-2 border">{row.tradeAmount ?? 0}</td>
                        <td className="px-3 py-2 border">{row.totalAmount ?? "NA"}</td>
                        <td className="px-3 py-2 border text-center">
                            {row.totalAmount == row.totalVerifiedAmount ? 
                                <FaCheck className='text-green-600 inline-block' title="Verified"/> : 
                                <FaTimes className='text-red-600 inline-block' title="Pending/Mismatch"/>
                            }
                        </td>
                        <td className="px-3 py-2 border">{row.totalVerifiedAmount ?? 0}</td>
                        <td className="px-3 py-2 border">
                            <Link
                                to={{
                                    pathname: "/accounts/cash-verification/view",
                                    search: createSearchParams({
                                        "userId": row?.id?.toString(),
                                        "fromDate": fromDate, 
                                        "uptoDate": uptoDate,
                                    }).toString(),
                                }}
                                className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-700 text-xs whitespace-nowrap transition duration-150"
                            >
                                <FaEye className="inline mr-1"/> View
                            </Link>
                        </td>
                    </tr>
                )}
            />
            {isModalPreviewOpen && (
                <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
            )}
        </>
    );
}