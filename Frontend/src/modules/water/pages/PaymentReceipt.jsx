import React from 'react'
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import { useNavigate, useParams } from 'react-router-dom';
import { getToken } from '../../../utils/auth';

function PaymentReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = getToken();
  const onClose=()=>{
    if(token){
      navigate(-1);
    }else{
      navigate("/");
    }
  }
  return (
    <>
      {id && (
        <PaymentReceiptModal
          id={id}
          onClose={onClose}
        />
      )}
    </>
  )
}

export default PaymentReceipt
