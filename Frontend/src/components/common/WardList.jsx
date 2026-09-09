const WardList = ({ wardMapped }) => {
  return (
    <div className="bg-white shadow-md p-2 border border-gray-200 rounded-lg">
      <h2 className="mb-2 font-bold text-gray-700 text-sm">Ward List</h2>
      <div className="gap-2 grid grid-cols-10">
        {wardMapped.map((ward) => (
          <button
            key={ward.id}
            className="bg-transparent p-2 border hover:border-transparent border-blue-200 rounded font-semibold text-color-2 hover:text-white hover-btn"
          >
            {ward?.wardNo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WardList;
