import { useParams } from "react-router-dom";
import ShopPaymentReceiptModal from "../components/ShopPaymentReceiptModal";

// Public page, opened from a receipt link. There is no close button because it is not a modal here.
function ShopPaymentReceipt() {
  const { id } = useParams();
  return id ? <ShopPaymentReceiptModal id={id} /> : null;
}

export default ShopPaymentReceipt;
