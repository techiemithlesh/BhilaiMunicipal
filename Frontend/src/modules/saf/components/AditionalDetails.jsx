const InfoRow = ({ leftLabel, leftValue, rightLabel, rightValue }) => (
  <div className="gap-4 grid grid-cols-1 md:grid-cols-2 hover:bg-gray-50 py-3 border-b last:border-b-0 transition">
    <div className="px-4 text-gray-700 text-sm">
      {leftLabel} <span className="font-semibold text-black">{leftValue}</span>
    </div>
    {rightLabel && (
      <div className="text-gray-700 text-sm">
        {rightLabel}{" "}
        <span className="font-semibold text-black">{rightValue}</span>
      </div>
    )}
  </div>
);

const AditionalDetails = ({ data }) => {
  if (!data) return null;

  return (
    <div className="bg-white shadow border border-blue-800 rounded-lg">
      <h3 className="bg-blue-900 px-4 py-2 rounded-t-md font-bold text-white">
        Additional Property Details
      </h3>
      <div className="overflow-x-auto">
        <InfoRow
          leftLabel="Does Property Have Mobile Tower(s)?"
          leftValue={data.isMobileTower ? "Yes" : "No"}
          rightLabel={
            data.isMobileTower ? "Date of Installation of Mobile Tower" : null
          }
          rightValue={data.isMobileTower ? data.towerInstallationDate : null}
        />
        {data.isMobileTower && data.towerArea && (
          <InfoRow
            leftLabel="Total Area Covered by Mobile Tower & its Equipments (Sq. Ft.)"
            leftValue={data.towerArea}
          />
        )}

        {/* Hoarding Board */}
        <InfoRow
          leftLabel="Does Property Have Hoarding Board(s)?"
          leftValue={data.isHoardingBoard ? "Yes" : "No"}
          rightLabel={
            data.isHoardingBoard
              ? "Date of Installation of Hoarding Board(s)"
              : null
          }
          rightValue={
            data.isHoardingBoard ? data.hoardingInstallationDate : null
          }
        />
        {data.isHoardingBoard && data.hoardingArea && (
          <InfoRow
            leftLabel="Total Area of Wall / Roof / Land (in Sq. Ft.)"
            leftValue={data.hoardingArea}
          />
        )}

        {/* Petrol Pump */}
        <InfoRow
          leftLabel="Is Property a Petrol Pump?"
          leftValue={data.isPetrolPump ? "Yes" : "No"}
          rightLabel={
            data.isPetrolPump ? "Completion Date of Petrol Pump" : null
          }
          rightValue={data.isPetrolPump ? data.petrolPumpCompletionDate : null}
        />
        {data.isPetrolPump && data.underGroundArea && (
          <InfoRow
            leftLabel="Underground Storage Area (in Sq. Ft.)"
            leftValue={data.underGroundArea}
          />
        )}

        {/* Rainwater Harvesting */}
        <InfoRow
          leftLabel="Rainwater Harvesting provision?"
          leftValue={data.isWaterHarvesting ? "Yes" : "No"}
          rightLabel={data.isWaterHarvesting ? "Installation Date" : null}
          rightValue={data.isWaterHarvesting ? data.waterHarvestingDate : null}
        />
      </div>
    </div>
  );
};

export default AditionalDetails;
