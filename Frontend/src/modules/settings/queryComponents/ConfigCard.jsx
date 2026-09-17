import React from "react";

export default function ConfigCard({
  card,
  cardIdx,
  draggedCardIndex,
  handleCardDragStart,
  handleCardDragOver,
  handleCardDragEnd,
  handleColDragStart,
  handleColDragOver,
  handleColDragEnd,
  updateCardHeader,
  updateColumnItem,
  addColumnToCard,
  removeColumnFromCard,
  removeCard,
  childGroups,
}) {
  return (
    <div
      draggable
      onDragStart={(e) => handleCardDragStart(e, cardIdx)}
      onDragOver={(e) => handleCardDragOver(e, cardIdx)}
      onDragEnd={handleCardDragEnd}
      className={`w-80 shrink-0 bg-white border-2 rounded-lg shadow-md p-3 flex flex-col gap-3 transition-all cursor-move select-none ${
        draggedCardIndex === cardIdx
          ? "border-purple-600 bg-purple-50 scale-95 opacity-80"
          : card.type === "parent"
          ? "border-blue-300 hover:border-blue-500"
          : "border-teal-300 hover:border-teal-500"
      }`}
    >
      <div className="flex justify-between items-center bg-gray-100 p-2 rounded border">
        <span className="text-xs font-bold text-gray-800">
          ⠿ Card #{cardIdx + 1}: {card.title}
        </span>
        <button onClick={() => removeCard(cardIdx)} className="text-red-500 hover:text-red-700 font-bold text-xs">
          ✕
        </button>
      </div>

      <div className="space-y-2 bg-gray-50 p-2 rounded border">
        <div>
          <label className="block text-[10px] uppercase font-bold text-indigo-800">Card Alias</label>
          <input
            type="text"
            className="w-full border border-gray-300 p-1 rounded text-xs font-semibold bg-white"
            value={card.title}
            onChange={(e) => updateCardHeader(cardIdx, "title", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-indigo-800">Meta Header</label>
          <input
            type="text"
            className="w-full border border-indigo-200 p-1 rounded text-xs font-semibold bg-white"
            value={card.metaHeader}
            onChange={(e) => updateCardHeader(cardIdx, "metaHeader", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-teal-800">Sub-Meta Header</label>
          <input
            type="text"
            className="w-full border border-teal-200 p-1 rounded text-xs font-semibold bg-white"
            value={card.subMetaHeader}
            onChange={(e) => updateCardHeader(cardIdx, "subMetaHeader", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-gray-600">Data Source Type</label>
          <select
            className="w-full border p-1 rounded text-xs bg-white"
            value={card.type}
            onChange={(e) => updateCardHeader(cardIdx, "type", e.target.value)}
          >
            <option value="parent">Parent Table</option>
            {childGroups.map((group, idx) => (
              <option key={idx} value={`child_${group}`}>
                Child Group: {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-60 pr-1">
        <span className="text-[10px] font-bold text-gray-500 uppercase">
          Configured Columns ({card.columns.length})
        </span>
        {card.columns.map((col, colIdx) => (
          <div
            key={colIdx}
            draggable
            onDragStart={(e) => handleColDragStart(e, cardIdx, colIdx)}
            onDragOver={(e) => handleColDragOver(e, cardIdx, colIdx)}
            onDragEnd={handleColDragEnd}
            className="flex items-center gap-1.5 bg-gray-50 border p-1.5 rounded text-xs cursor-move hover:bg-gray-100"
          >
            <span className="text-gray-400 font-bold">::</span>
            <input
              type="text"
              placeholder="Key"
              className="w-1/2 border p-1 rounded text-[11px] bg-white font-mono"
              value={col.key}
              onChange={(e) => updateColumnItem(cardIdx, colIdx, "key", e.target.value)}
            />
            <input
              type="text"
              placeholder="Label"
              className="w-1/2 border p-1 rounded text-[11px] bg-white"
              value={col.label}
              onChange={(e) => updateColumnItem(cardIdx, colIdx, "label", e.target.value)}
            />
            <button
              onClick={() => removeColumnFromCard(cardIdx, colIdx)}
              className="text-red-500 hover:text-red-700 font-bold text-xs p-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => addColumnToCard(cardIdx)}
        className="w-full border-2 border-dashed border-gray-300 text-gray-600 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1"
      >
        + Add Column
      </button>
    </div>
  );
}