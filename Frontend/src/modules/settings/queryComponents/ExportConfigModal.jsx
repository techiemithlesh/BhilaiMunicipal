import React, { useState } from "react";
import ConfigCard from "./ConfigCard";
import ExcelPreviewTable from "./ExcelPreviewTable";

export default function ExportConfigModal({
  setIsExportModalOpen,
  modalSql,
  setModalSql,
  handleStartConfig,
  handleResetConfig,
  isConfigExecuting,
  exportTitle,
  setExportTitle,
  exportFileName,
  setExportFileName,
  cardsConfig,
  setCardsConfig,
  childGroups,
  handleExportExcel,
  isExporting,
}) {
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [draggedColInfo, setDraggedColInfo] = useState(null);

  const addNewCard = () => {
    const cardCount = cardsConfig.length + 1;
    setCardsConfig([
      ...cardsConfig,
      {
        cardId: "card_" + Date.now(),
        title: `NEW SECTION #${cardCount}`,
        type: "parent",
        metaHeader: `SECTION ${cardCount} HEADER`,
        subMetaHeader: "Custom Sub-Details",
        columns: [{ key: "", label: "New Field", type: "parent" }],
      },
    ]);
  };

  const removeCard = (cardIndex) => {
    setCardsConfig(cardsConfig.filter((_, i) => i !== cardIndex));
  };

  const handleCardDragStart = (e, index) => {
    setDraggedCardIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCardDragOver = (e, targetIndex) => {
    e.preventDefault();
    if (draggedCardIndex === null || draggedCardIndex === targetIndex) return;

    const updated = [...cardsConfig];
    const draggedCard = updated[draggedCardIndex];
    updated.splice(draggedCardIndex, 1);
    updated.splice(targetIndex, 0, draggedCard);

    setDraggedCardIndex(targetIndex);
    setCardsConfig(updated);
  };

  const handleCardDragEnd = () => setDraggedCardIndex(null);

  const handleColDragStart = (e, cardIndex, colIndex) => {
    e.stopPropagation();
    setDraggedColInfo({ cardIndex, colIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColDragOver = (e, targetCardIndex, targetColIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedColInfo) return;
    const { cardIndex: srcCardIdx, colIndex: srcColIdx } = draggedColInfo;

    if (srcCardIdx !== targetCardIndex || srcColIdx === targetColIndex) return;

    const updatedCards = [...cardsConfig];
    const targetCardCols = [...updatedCards[targetCardIndex].columns];

    const draggedCol = targetCardCols[srcColIdx];
    targetCardCols.splice(srcColIdx, 1);
    targetCardCols.splice(targetColIndex, 0, draggedCol);

    updatedCards[targetCardIndex].columns = targetCardCols;
    setDraggedColInfo({ cardIndex: targetCardIndex, colIndex: targetColIndex });
    setCardsConfig(updatedCards);
  };

  const handleColDragEnd = (e) => {
    e.stopPropagation();
    setDraggedColInfo(null);
  };

  const updateCardHeader = (cardIndex, field, value) => {
    const updated = [...cardsConfig];
    updated[cardIndex][field] = value;
    setCardsConfig(updated);
  };

  const updateColumnItem = (cardIndex, colIndex, field, value) => {
    const updated = [...cardsConfig];
    updated[cardIndex].columns[colIndex][field] = value;
    setCardsConfig(updated);
  };

  const addColumnToCard = (cardIndex) => {
    const updated = [...cardsConfig];
    const card = updated[cardIndex];
    card.columns.push({ key: "", label: "New Column", type: card.type });
    setCardsConfig(updated);
  };

  const removeColumnFromCard = (cardIndex, colIndex) => {
    const updated = [...cardsConfig];
    updated[cardIndex].columns.splice(colIndex, 1);
    setCardsConfig(updated);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-[98vw] max-w-[1500px] h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-base font-bold text-gray-800">
              Excel Configuration & Export Configurator
            </h3>
            <p className="text-xs text-gray-500">
              Set SQL statement, start configuration with single record (`LIMIT 1`), drag cards/columns, or reset.
            </p>
          </div>
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="text-gray-500 hover:text-gray-700 font-bold text-xl"
          >
            ×
          </button>
        </div>

        {/* Query Controls */}
        <div className="p-3 bg-slate-50 border-b flex flex-col gap-2">
          <label className="block text-xs font-bold text-slate-700 uppercase">
            Configuration SQL Statement
          </label>
          <textarea
            rows={3}
            className="w-full border p-2 rounded text-xs font-mono bg-white border-slate-300"
            placeholder="Enter SQL statement..."
            value={modalSql}
            onChange={(e) => setModalSql(e.target.value)}
          />
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={handleStartConfig}
                disabled={isConfigExecuting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold"
              >
                {isConfigExecuting ? "Executing..." : "▶ Start Configuration"}
              </button>
              <button
                onClick={handleResetConfig}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs font-bold"
              >
                ↺ Reset Configuration
              </button>
            </div>
            <button
              onClick={addNewCard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold"
            >
              + Add New Card Section
            </button>
          </div>
        </div>

        {/* Global Metadata */}
        <div className="px-4 py-2 border-b bg-gray-100 flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">Excel Title</label>
            <input
              type="text"
              className="w-full border p-1 rounded text-xs bg-white"
              value={exportTitle}
              onChange={(e) => setExportTitle(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-700 mb-0.5">File Name</label>
            <input
              type="text"
              className="w-full border p-1 rounded text-xs bg-white"
              value={exportFileName}
              onChange={(e) => setExportFileName(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Cards & Live Preview */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-200 flex flex-col gap-6">
          <div>
            <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">
              1. Dynamic Card Layout Configurator
            </h4>
            {cardsConfig.length === 0 ? (
              <div className="p-8 bg-white border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 text-xs">
                No active cards configured. Click <b>"▶ Start Configuration"</b> above to automatically build default cards.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-3">
                {cardsConfig.map((card, cardIdx) => (
                  <ConfigCard
                    key={card.cardId || cardIdx}
                    card={card}
                    cardIdx={cardIdx}
                    draggedCardIndex={draggedCardIndex}
                    handleCardDragStart={handleCardDragStart}
                    handleCardDragOver={handleCardDragOver}
                    handleCardDragEnd={handleCardDragEnd}
                    handleColDragStart={handleColDragStart}
                    handleColDragOver={handleColDragOver}
                    handleColDragEnd={handleColDragEnd}
                    updateCardHeader={updateCardHeader}
                    updateColumnItem={updateColumnItem}
                    addColumnToCard={addColumnToCard}
                    removeColumnFromCard={removeColumnFromCard}
                    removeCard={removeCard}
                    childGroups={childGroups}
                  />
                ))}
              </div>
            )}
          </div>

          <ExcelPreviewTable cardsConfig={cardsConfig} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => setIsExportModalOpen(false)}
            className="px-4 py-2 border rounded text-xs font-semibold text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded text-xs font-bold flex items-center gap-2 disabled:bg-gray-400"
          >
            {isExporting ? "Exporting..." : "⬇ Download Formatted Excel"}
          </button>
        </div>
      </div>
    </div>
  );
}