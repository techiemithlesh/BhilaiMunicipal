import React from 'react'
import { useParams } from 'react-router-dom';
import PaymentReceiptModal from '../components/PaymentReceiptModal';

function SwmPaymentReceipt() {
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

export default SwmPaymentReceipt
