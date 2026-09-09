import QRCode from "react-qr-code"; // ✅ This works with Vite + ESM

function QRCodeComponent({
  value = "https://example.com",
  size = 200,
  bgColor = "#ffffff",
  fgColor = "#000000",
}) {
  return (
    <div className="p-4">
      <QRCode value={value} size={size} bgColor={bgColor} fgColor={fgColor} />
    </div>
  );
}

export default QRCodeComponent;
