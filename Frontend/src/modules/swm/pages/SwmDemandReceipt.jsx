import React from 'react'
import DemandReceiptModal from '../components/DemandReceiptModal';
import { useParams } from 'react-router-dom';

function SwmDemandReceipt() {
  const { id } = useParams();
  return (
    <>
    {id &&(
        <DemandReceiptModal
            id={id}
        />
    )}
    </>
  )
}

export default SwmDemandReceipt
