import React from "react";
import { Spinner } from "@nextui-org/react";

export default function DatabaseSidebar({
  isSidebarOpen,
  selectedDb,
  setSelectedDb,
  dbList,
  tablesList,
  isTableLoading,
  handleTableClick,
}) {
  return (
    <div
      className={`${
        isSidebarOpen ? "col-span-3 block" : "hidden"
      } bg-gray-50 border rounded p-3 transition-all duration-300`}
    >
      <h3 className="font-semibold text-sm mb-2">Database</h3>
      <select
        className="w-full border p-2 rounded"
        value={selectedDb}
        onChange={(e) => setSelectedDb(e.target.value)}
      >
        {dbList.map((db, i) => (
          <option key={i} value={db?.value}>
            {db?.label}
          </option>
        ))}
      </select>

      <h3 className="font-semibold text-sm mt-4 mb-2">Tables</h3>
      <div className="h-[400px] overflow-y-scroll border p-2 rounded bg-white">
        {tablesList.map((t, i) => (
          <div
            key={i}
            className={`${
              t?.relkind === "f"
                ? "text-red-500"
                : t?.relkind === "v"
                ? "text-yellow-600"
                : t?.relkind === "m"
                ? "text-yellow-900"
                : "text-blue-700"
            } cursor-pointer hover:underline text-sm py-1`}
            onClick={() => handleTableClick(t?.name)}
            title={t?.table_type}
          >
            {t?.name}
          </div>
        ))}
        {isTableLoading && <Spinner />}
      </div>
    </div>
  );
}