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
        <InfoRow
          leftLabel="Widow/Abandoned/Mentally Disable/Visually Impaired?"
          leftValue={data.isWidow ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Ex-Army (Income Tax Exempted)?"
          leftValue={data.isExArmy ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Physically Disable?"
          leftValue={data.isDisabledPerson ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Old Property waived Off?"
          leftValue={data.isOldProperty ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Belongs to IHSDP?"
          leftValue={data.isDp ? "Yes" : "No"}
        />
        <InfoRow leftLabel="Is School?" leftValue={data.isSchool ? "Yes" : "No"} />
        <InfoRow
          leftLabel="Is Complex?"
          leftValue={data.isComplex ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Is Chabutra?"
          leftValue={data.isChabutra ? "Yes" : "No"}
        />
        <InfoRow
          leftLabel="Holding Belongs To Shop?"
          leftValue={data.isShopHolding ? "Yes" : "No"}
        />
      </div>
    </div>
  );
};

export default AditionalDetails;
