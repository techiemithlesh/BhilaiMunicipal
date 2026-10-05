import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input, Select, SelectItem, Checkbox, Button } from "@nextui-org/react";
import { swmSubCategoryListApi, swmGetRateApi } from "../../../api/endpoints";
import { getToken } from "../../../utils/auth";
import { getCurrentYearMonth } from "../../../utils/common";

const ConnectionDetails = ({
  dateOfEffect = "",
  onDateOfEffectChange,
  connectionDtl = [],
  categoryList = [],
  onChange,
  onAddRow,
  onRemoveRow,
  validationError = {},
  isFrozen = false,
}) => {
  const token = getToken();
  const [subCategoryMap, setSubCategoryMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [rateLoadingMap, setRateLoadingMap] = useState({});
  const today = getCurrentYearMonth();

  // Fetch subcategories per row when category changes
  const fetchSubCategoryForRow = useCallback(
    async (rowIndex, categoryId) => {
      if (!categoryId) {
        setSubCategoryMap((prev) => ({ ...prev, [rowIndex]: [] }));
        return;
      }

      setLoadingMap((prev) => ({ ...prev, [rowIndex]: true }));
      try {
        const response = await axios.post(
          swmSubCategoryListApi,
          { categoryTypeMasterId: categoryId, all: "all" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response?.data?.status) {
          setSubCategoryMap((prev) => ({
            ...prev,
            [rowIndex]: response.data.data || [],
          }));
        }
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      } finally {
        setLoadingMap((prev) => ({ ...prev, [rowIndex]: false }));
      }
    },
    [token]
  );

  // Fetch rate for a specific row
  const fetchRateForRow = useCallback(
    async (rowIndex, rowData) => {
      const categoryId = rowData?.categoryTypeMasterId;
      const subCategoryId = rowData?.subCategoryTypeMasterId;

      if (!categoryId || !subCategoryId) {
        onChange(rowIndex, "rate", "");
        return;
      }

      setRateLoadingMap((prev) => ({ ...prev, [rowIndex]: true }));
      try {
        const response = await axios.post(
          swmGetRateApi,
          {
            dateOfEffective: dateOfEffect,
            ...rowData,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response?.data?.status) {
          const rateValue = response.data.data?.currentRate ?? 0;
          onChange(rowIndex, "rate", rateValue);
        } else {
          onChange(rowIndex, "rate", 0);
        }
      } catch (error) {
        console.error("Error fetching rate:", error);
        onChange(rowIndex, "rate", "");
      } finally {
        setRateLoadingMap((prev) => ({ ...prev, [rowIndex]: false }));
      }
    },
    [dateOfEffect, onChange, token]
  );

  // Pre-fetch subcategories on mount or row addition
  useEffect(() => {
    connectionDtl.forEach((row, index) => {
      if (row.categoryTypeMasterId && !subCategoryMap[index]) {
        fetchSubCategoryForRow(index, row.categoryTypeMasterId);
      }
    });
  }, [connectionDtl, subCategoryMap, fetchSubCategoryForRow]);

  // Refetch rate across all rows if the main Date of Effect changes
  useEffect(() => {
    if (!dateOfEffect) return;
    connectionDtl.forEach((row, index) => {
      if (row.categoryTypeMasterId && row.subCategoryTypeMasterId) {
        fetchRateForRow(index, row);
      }
    });
  }, [dateOfEffect]);

  // Handler for category updates
  const handleCategoryChange = (index, value) => {
    const updatedRow = {
      ...connectionDtl[index],
      categoryTypeMasterId: value,
      subCategoryTypeMasterId: "",
      rate: "",
    };

    onChange(index, "categoryTypeMasterId", value);
    onChange(index, "subCategoryTypeMasterId", "");
    onChange(index, "rate", "");

    fetchSubCategoryForRow(index, value);
  };

  // Handler for sub-category updates
  const handleSubCategoryChange = (index, value) => {
    const updatedRow = {
      ...connectionDtl[index],
      subCategoryTypeMasterId: value,
    };

    onChange(index, "subCategoryTypeMasterId", value);

    if (updatedRow.categoryTypeMasterId && value) {
      fetchRateForRow(index, updatedRow);
    }
  };

  // Unified field handler for non-category fields
  const handleFieldChange = (index, field, value) => {
    onChange(index, field, value);

    // Skip triggering rate fetch when the field being updated is rate itself
    if (field === "rate") return;

    const updatedRow = {
      ...connectionDtl[index],
      [field]: value,
    };

    if (updatedRow.categoryTypeMasterId && updatedRow.subCategoryTypeMasterId) {
      fetchRateForRow(index, updatedRow);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Date of Effect */}
      <div className="bg-gray-100 p-4 rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-700 text-lg">Connection Details</h3>
          <p className="text-xs text-gray-500">Configure connection types and effective date</p>
        </div>

        {/* Global Date of Effect Field */}
        <div className="flex flex-col w-full md:w-64">
          <Input
            type="month"
            label="Date of Effect"
            labelPlacement="outside"
            isRequired
            max={today}
            value={dateOfEffect || ""}
            name="dateOfEffective"
            onChange={(e) => onDateOfEffectChange("dateOfEffective", e.target.value)}
            isDisabled={isFrozen}
            errorMessage={validationError.dateOfEffective}
            size="sm"
            variant="bordered"
            classNames={{ inputWrapper: "bg-white" }}
          />
        </div>

        <Button
          type="button"
          onClick={onAddRow}
          isDisabled={isFrozen}
          color="success"
          startContent={<FaPlus />}
          className="text-white self-start md:self-auto"
        >
          Add
        </Button>
      </div>

      {/* Dynamic Connection Detail Rows */}
      {connectionDtl.map((row, index) => {
        const rowError = (field) => validationError[`connectionDtl.${index}.${field}`];

        return (
          <div
            key={index}
            className="p-4 border border-gray-200 rounded-lg shadow-sm relative bg-white flex flex-col gap-4"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-semibold text-blue-800 text-sm">
                Connection #{index + 1}
              </span>
              {connectionDtl.length > 1 && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  color="danger"
                  onClick={() => onRemoveRow(index)}
                  isDisabled={isFrozen}
                  title="Remove Connection"
                  type="button"
                >
                  <FaTrash />
                </Button>
              )}
            </div>

            {/* Core Dropdowns, Rate & Quantity */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Dropdown */}
              <Select
                isRequired
                label="Category"
                labelPlacement="outside"
                placeholder="Select Category"
                selectedKeys={row.categoryTypeMasterId ? [String(row.categoryTypeMasterId)] : []}
                onChange={(e) => handleCategoryChange(index, e.target.value)}
                isDisabled={isFrozen}
                errorMessage={rowError("categoryTypeMasterId")}
                size="sm"
                variant="bordered"
                classNames={{ trigger: "bg-white" }}
              >
                {(categoryList || []).map((cat) => (
                  <SelectItem key={String(cat.id)} value={String(cat.id)}>
                    {cat.categoryType || cat.name}
                  </SelectItem>
                ))}
              </Select>

              {/* Sub-Category Dropdown */}
              <Select
                isRequired
                label="Sub Category"
                labelPlacement="outside"
                placeholder={
                  loadingMap[index] ? "Loading..." : "Select Sub Category"
                }
                selectedKeys={
                  row.subCategoryTypeMasterId ? [String(row.subCategoryTypeMasterId)] : []
                }
                onChange={(e) => handleSubCategoryChange(index, e.target.value)}
                isDisabled={isFrozen || loadingMap[index]}
                errorMessage={rowError("subCategoryTypeMasterId")}
                size="sm"
                variant="bordered"
                classNames={{ trigger: "bg-white" }}
              >
                {(subCategoryMap[index] || []).map((sub) => (
                  <SelectItem key={String(sub.id)} value={String(sub.id)}>
                    {sub.subCategoryType || sub.name}
                  </SelectItem>
                ))}
              </Select>

              {/* Total No of House / Area / Rooms */}
              <Input
                type="number"
                min="1"
                isRequired
                label="Total No. of House / Area / Room"
                labelPlacement="outside"
                placeholder="Enter Count"
                value={row.totalNoOfHouseAreaRoomTruck || ""}
                onChange={(e) =>
                  handleFieldChange(index, "totalNoOfHouseAreaRoomTruck", e.target.value)
                }
                isDisabled={isFrozen}
                errorMessage={rowError("totalNoOfHouseAreaRoomTruck")}
                size="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-white" }}
              />

              {/* Rate Field (Auto-Fetched & Readonly) */}
              <Input
                type="number"
                label="Rate"
                labelPlacement="outside"
                placeholder={rateLoadingMap[index] ? "Fetching..." : "Auto Rate"}
                value={row.rate ?? ""}
                isReadOnly
                isDisabled={isFrozen}
                size="sm"
                variant="bordered"
                classNames={{ inputWrapper: "bg-gray-100" }}
              />
            </div>

            {/* Conditional Provisions Checkboxes */}
            {row?.categoryTypeMasterId == 16 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-3 rounded border mt-2">
                {/* Restaurant Option */}
                <div className="flex flex-col gap-2">
                  <Checkbox
                    isSelected={
                      row.hasRestaurant === true || row.hasRestaurant === "true"
                    }
                    onValueChange={(checked) =>
                      handleFieldChange(index, "hasRestaurant", checked)
                    }
                    isDisabled={isFrozen}
                    size="sm"
                  >
                    Has Restaurant?
                  </Checkbox>

                  {(row.hasRestaurant === true || row.hasRestaurant === "true") && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Total No. of Restaurants"
                      value={row.totalNoOfRestaurant || ""}
                      isRequired={
                        row.hasRestaurant === true || row.hasRestaurant === "true"
                      }
                      onChange={(e) =>
                        handleFieldChange(index, "totalNoOfRestaurant", e.target.value)
                      }
                      isDisabled={isFrozen}
                      errorMessage={rowError("totalNoOfRestaurant")}
                      size="sm"
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white" }}
                    />
                  )}
                </div>

                {/* Garden Option */}
                <div className="flex flex-col gap-2">
                  <Checkbox
                    isSelected={
                      row.hasGarden === true || row.hasGarden === "true"
                    }
                    onValueChange={(checked) =>
                      handleFieldChange(index, "hasGarden", checked)
                    }
                    isDisabled={isFrozen}
                    size="sm"
                  >
                    Has Garden?
                  </Checkbox>

                  {(row.hasGarden === true || row.hasGarden === "true") && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Total No. of Gardens"
                      value={row.totalNoOfGarden || ""}
                      isRequired={
                        row.hasGarden === true || row.hasGarden === "true"
                      }
                      onChange={(e) =>
                        handleFieldChange(index, "totalNoOfGarden", e.target.value)
                      }
                      isDisabled={isFrozen}
                      errorMessage={rowError("totalNoOfGarden")}
                      size="sm"
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white" }}
                    />
                  )}
                </div>

                {/* Banquet Hall Option */}
                <div className="flex flex-col gap-2">
                  <Checkbox
                    isSelected={
                      row.hasBanquetHall === true || row.hasBanquetHall === "true"
                    }
                    onValueChange={(checked) =>
                      handleFieldChange(index, "hasBanquetHall", checked)
                    }
                    isDisabled={isFrozen}
                    size="sm"
                  >
                    Has Banquet Hall?
                  </Checkbox>

                  {(row.hasBanquetHall === true || row.hasBanquetHall === "true") && (
                    <Input
                      type="number"
                      min="1"
                      placeholder="Total No. of Banquet Halls"
                      value={row.totalNoOfBanquetHall || ""}
                      isRequired={
                        row.hasBanquetHall === true || row.hasBanquetHall === "true"
                      }
                      onChange={(e) =>
                        handleFieldChange(index, "totalNoOfBanquetHall", e.target.value)
                      }
                      isDisabled={isFrozen}
                      errorMessage={rowError("totalNoOfBanquetHall")}
                      size="sm"
                      variant="bordered"
                      classNames={{ inputWrapper: "bg-white" }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConnectionDetails;