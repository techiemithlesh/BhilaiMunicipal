import RenderFieldList from "../../../common/RenderFieldList";
import InfoTable from "../../../common/InfoTable";

export default function TradeLicensePreview({
  formData,
  firmDetails,
  ownerHeaders,
  ownerRows,
  onOpenUpload,
}) {
  return (
    <>
      <RenderFieldList title="Apply License" fields={formData} />
      <RenderFieldList title="Firm Details" fields={firmDetails} />

      <div className="flex flex-col gap-2 w-full text-gray-700 text-lg">
        <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-700 to-blue-400 shadow-md p-3 rounded-md font-bold text-white text-lg uppercase tracking-wide">
          Owner Details
        </h2>
        <InfoTable
          headers={ownerHeaders}
          rows={ownerRows}
          onUploadClick={(row, index) => {
            setSelectedDocIndex(index);
            setShowUploadModal(true);
          }}
        />
      </div>
    </>
  );
}
