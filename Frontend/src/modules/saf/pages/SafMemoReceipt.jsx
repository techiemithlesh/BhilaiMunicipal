import React from 'react'
import { useParams } from 'react-router-dom';
import SAMModal from '../components/SAMModal';

function SafMemoReceipt() {
    const { id } = useParams();
    const { lag } = useParams();
  return (
    <>
        {id && (
            <SAMModal id ={id} lag={lag} />
        )}
    </>
  )
}

export default SafMemoReceipt
