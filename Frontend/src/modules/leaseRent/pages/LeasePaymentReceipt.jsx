import { useParams } from "react-router-dom";
import LeasePaymentReceiptModal from "../components/LeasePaymentReceiptModal";

// Public page, opened from a receipt link.
function LeasePaymentReceipt() {
  const { id } = useParams();
  return id ? <LeasePaymentReceiptModal id={id} /> : null;
}

export default LeasePaymentReceipt;
