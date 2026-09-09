import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { getToken } from "../../../utils/auth";
import {
  getWardListApi,
  roleUserApi,
  userApi,
  waterLevelWisePendingApi,
  waterWfRoleListApi,
} from "../../../api/endpoints";
import CommonTable from "../../../components/common/CommonTable";
import Select from "react-select";
import { Link, useSearchParams } from "react-router-dom";
import { FaEye } from "react-icons/fa";
import { buildFilterQueryString } from "../../../utils/common";

function AppPendingList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const token = getToken();

  const [dataList, setDataList] = useState([]);
  const [roleList, setRoleList] = useState([]);
  const [allUserList, setAllUserList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [wardList, setWardList] = useState([]);

  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || "");
  const [toDate, setToDate] = useState(searchParams.get("toDate") || "");
  const [wardId, setWardId] = useState([]);
  const [roleId, setRoleId] = useState([]);
  const [userId, setUserId] = useState([]);

  const [isFrozen, setIsFrozen] = useState(false);
  const [isWardLoading, setIsWardLoading] = useState(false);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [totalPage, setTotalPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItem, setTotalItem] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const filters = useMemo(
    () => ({
      fromDate: fromDate || "",
      uptoDate: toDate || "",
      wardId,
      roleId,
      userId,
    }),
    [fromDate, toDate, wardId, roleId, userId]
  );

  const syncURLFilters = () => {
    const query = buildFilterQueryString(filters);
    setSearchParams(query);
  };

  const handleSearch = () => {
    setPage(1);
    syncURLFilters();
    fetchData();
  };

  const fetchData = async (customFilters = null) => {
    setIsFrozen(true);
    try {
      const res = await axios.post(
        waterLevelWisePendingApi,
        {
          page,
          perPage: itemsPerPage,
          key: search.trim() || null,
          ...(customFilters || filters),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const list = res.data.data || {};
      setDataList(list.data || []);
      setTotalPage(list.lastPage || 1);
      setTotalItem(list.total || 0);
    } catch (err) {
      console.error("Error fetching pending list:", err);
    } finally {
      setIsFrozen(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const res = await axios.post(
        waterLevelWisePendingApi,
        {
          page: 1,
          perPage: totalItem,
          key: search.trim() || null,
          ...filters,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return (res.data.data?.data || []).map((item) => ({
        ...item,
        fromUpto: `${item.fromFyear} (${item.fromQtr}) / ${item.uptoFyear} (${item.uptoQtr})`,
      }));
    } catch (err) {
      console.error("Error fetching all data for export:", err);
      return [];
    }
  };

  const fetchUsersByRole = async (selectedRoleIds, selectedUserIds = []) => {
    if (!selectedRoleIds.length) {
      setUserList(allUserList);
      setUserId(userId);
      return;
    }

    setIsUserLoading(true);
    try {
      const res = await axios.post(
        roleUserApi,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { all: true, "id[]": selectedRoleIds },
        }
      );
      if (res?.data?.status) {
        const userOpts = res.data.data.map((u) => ({
          value: u.id,
          label: u.name,
        }));
        setUserList(userOpts);
        setUserId(selectedUserIds);
      }
    } catch (error) {
      console.error("Error fetching users by role:", error);
    } finally {
      setIsUserLoading(false);
    }
  };

  const initFiltersAndFetchData = async () => {
    try {
      setIsWardLoading(true);
      setIsRoleLoading(true);
      setIsUserLoading(true);

      const [wardRes, roleRes, userRes] = await Promise.all([
        axios.get(getWardListApi, {
          headers: { Authorization: `Bearer ${token}` },
          params: { all: true },
        }),
        axios.post(
          waterWfRoleListApi,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        axios.get(userApi, {
          headers: { Authorization: `Bearer ${token}` },
          params: { all: true },
        }),
      ]);

      const wardIds = searchParams.getAll("wardId[]").map(Number);
      const roleIds = searchParams.getAll("roleId[]").map(Number);
      const userIds = searchParams.getAll("userId[]").map(Number);

      if (wardRes?.data?.status) {
        const wardOpts = wardRes.data.data.map((w) => ({
          value: w.id,
          label: w.wardNo,
        }));
        setWardList(wardOpts);
        setWardId(wardIds);
      }

      if (roleRes?.data?.status) {
        const roleOpts = roleRes.data.data.map((r) => ({
          value: r.id,
          label: r.roleName,
        }));
        setRoleList(roleOpts);
        setRoleId(roleIds);
      }

      if (userRes?.data?.status) {
        const userOpts = userRes.data.data.map((u) => ({
          value: u.id,
          label: u.name,
        }));
        setUserList(userOpts);
        setAllUserList(userOpts);
        setUserId(userIds);
      }

      await fetchUsersByRole(roleIds, userIds);

      await fetchData({
        fromDate: searchParams.get("fromDate") || "",
        uptoDate: searchParams.get("toDate") || "",
        wardId: wardIds,
        roleId: roleIds,
        userId: userIds,
      });
    } catch (err) {
      console.error("Error initializing filters and data:", err);
    } finally {
      setIsWardLoading(false);
      setIsRoleLoading(false);
    }
  };

  const handleRoleChange = async (selected) => {
    const selectedRoleIds = selected.map((opt) => opt.value);
    setRoleId(selectedRoleIds);
    setUserId([]);
    await fetchUsersByRole(selectedRoleIds);
  };

  useEffect(() => {
    if (token) {
      setIsFrozen(true);
      initFiltersAndFetchData();
    }
  }, [token]);

  useEffect(()=>{
    fetchData();
  },[page, itemsPerPage])

  const headers = [
    { label: "#", key: "serial" },
    { label: "Ward No.", key: "wardNo" },
    { label: "Application No.", key: "applicationNo" },
    { label: "Owner Name", key: "ownerName" },
    { label: "Mobile No.", key: "mobileNo" },
    { label: "Address", key: "address" },
    { label: "Action", key: "action" },
  ];

  const renderRow = (item, index, currentPage, perPage) => (
    <tr key={item.id} className="hover:bg-gray-50">
      <td className="px-3 py-2 border">
        {(currentPage - 1) * perPage + index + 1}
      </td>
      <td className="px-3 py-2 border">{item.wardNo}</td>
      <td className="px-3 py-2 border">{item.applicationNo}</td>
      <td className="px-3 py-2 border">{item.ownerName}</td>
      <td className="px-3 py-2 border">{item.mobileNo}</td>
      <td className="px-3 py-2 border">{item.address}</td>
      <td className="px-3 py-2 border">
        <Link
          to={`/water/app/detail/${item.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          <FaEye className="w-5 h-5" />
        </Link>
      </td>
    </tr>
  );

  const filterComponent = (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
      <div>
        <label className="block text-sm">From Date</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
      <div>
        <label className="block text-sm">To Date</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-2 py-1 border rounded w-full"
        />
      </div>
      <div>
        <label className="block text-sm">Ward No.</label>
        <Select
          isMulti
          isLoading={isWardLoading}
          options={wardList}
          value={wardList.filter((opt) => wardId.includes(opt.value))}
          onChange={(selected) => setWardId(selected.map((opt) => opt.value))}
          placeholder="Select Ward(s)..."
        />
      </div>
      <div>
        <label className="block text-sm">Role</label>
        <Select
          isMulti
          isLoading={isRoleLoading}
          options={roleList}
          value={roleList.filter((opt) => roleId.includes(opt.value))}
          onChange={handleRoleChange}
          placeholder="Select Role(s)..."
        />
      </div>
      <div>
        <label className="block text-sm">Collector</label>
        <Select
          isMulti
          isLoading={isUserLoading}
          options={userList}
          value={userList.filter((opt) => userId.includes(opt.value))}
          onChange={(selected) => setUserId(selected.map((opt) => opt.value))}
          placeholder="Select Collector(s)..."
        />
      </div>
    </div>
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
        title="Collection Report"
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
        filterComponent={filterComponent}
      />
    </div>
  );
}

export default AppPendingList
