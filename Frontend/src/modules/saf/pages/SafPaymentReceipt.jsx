import React from 'react'
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import { useParams } from 'react-router-dom';

function SafPaymentReceipt() {
    const { id } = useParams();
  return (
    <>
    {id &&(
        <PaymentReceiptModal
            id={id}
        />
    )}
    </>
  )
}

export default SafPaymentReceipt
