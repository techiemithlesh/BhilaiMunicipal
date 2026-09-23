import { useEffect, useState } from 'react'
import { getToken } from '../../../utils/auth';
import axios from 'axios';
import CommonTable from '../../../components/common/CommonTable';
import { swmConsumerCategoryTypeApi } from '../../../api/endpoints';

const CategoryTypeConsumer = () => {
    const token = getToken();
    const [isFrozen, setIsFrozen] = useState(false);
    const [dataList, setDataList] = useState([]);
    const [summary, setSummary] = useState({});

    const [totalPage, setTotalPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItem, setTotalItem] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (token) fetchData();
      }, [token, page, itemsPerPage]);

    const fetchData = async () => {
        setIsFrozen(true);
        try {
            const res = await axios.post(swmConsumerCategoryTypeApi,
                {
                    page,
                    perPage: itemsPerPage,
                    key: search.trim() || null,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                });
            const list = res.data.data || {};
            setDataList(list.data || []);
            setSummary(list?.summary || {})
            setTotalPage(list.lastPage || 1);
            setTotalItem(list.total || 0);
        } catch (err) {
            console.error("Error fetching team summary:", err);
        } finally {
            setIsFrozen(false);
        }
    };

    /** ---------------------------
     *   🔹 Export All Data
     * --------------------------- */
    const fetchAllData = async () => {
        try {
            const res = await axios.post(swmConsumerCategoryTypeApi, {
                page: 1,
                perPage: totalItem,
                key: search.trim() || null,
            },
                {
                    headers: { Authorization: `Bearer ${token}` },
                });
            return (res.data.data || []);
        } catch (err) {
            console.error("Error fetching all data for export:", err);
            return [];
        }
    };


    const handleSearch = () => {
        setPage(1);
        fetchData();
      };
    
      const headers = [
        { label: "#", key: "serial" },
        { label: "Category Type", key: "categoryType" },
        { label: "Total Consumer", key: "totalConsumer" },
      ];
    
      const renderRow = (item, index, currentPage, perPage) => (
        <tr key={item.id} className="hover:bg-gray-50">
          <td className="px-3 py-2 border">
            {(currentPage - 1) * perPage + index + 1}
          </td>
          <td className="px-3 py-2 border">{item.categoryType}</td>
          <td className="px-3 py-2 border">{item.totalConsumer}</td>
        </tr>
      );

    const renderFooter = (totals) => (
        <tr className="bg-gray-200 font-bold">
            <td className="px-3 py-2 border text-center">
                Total
            </td>
            <td className="px-3 py-2 border">{totals.total}</td>
            <td className="px-3 py-2 border">{totals.totalConsumer}</td>
        </tr>
    );

    return (
        <div
            className={`${
            isFrozen ? "pointer-events-none filter blur-sm" : ""
            } w-full space-y-4`}
        >
            <CommonTable
                data={dataList}
                headers={headers}
                renderRow={renderRow}
                footerRow={renderFooter(summary)}
                title="Category Type Consumer"
                totalPages={totalPage}
                currentPage={page}
                setPageNo={setPage}
                totalItem={totalItem}
                setItemsPerPage={setItemsPerPage}
                itemsPerPage={itemsPerPage}
                isSearchInput={false}
                search={search}
                setSearch={setSearch}
                onSearch={handleSearch}
                fetchAllData={fetchAllData}
            />
        </div>
    )
}

export default CategoryTypeConsumer
