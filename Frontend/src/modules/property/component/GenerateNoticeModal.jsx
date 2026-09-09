import axios from 'axios';
import { useEffect, useState } from 'react'
import { propDueApi, propertyGenerateNoticeApi, propertyNoticeDeactivateApi, propertyNoticeListApi } from '../../../api/endpoints';
import { getToken } from '../../../utils/auth';
import { formatLocalDate, formatLocalDateTime } from '../../../utils/common';
import { motion } from "framer-motion";
import { modalVariants } from "../../../utils/motionVariable";
import { FaTimes } from "react-icons/fa";
import { toastMsg } from '../../../utils/utils';
import { Button } from '@nextui-org/react';
import NoticeViewModal from './NoticeViewModal';

function GenerateNoticeModal({id,onClose,onSuccess,permissionSet={}}) {
    const token = getToken();
    const [noticeList, setNoticeList] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    const [demandData, setDemandData] = useState({});
    const [isNoticeViewModal, setIsNoticeViewModal] = useState(false);
    const [noticeId, setNoticeId] = useState(null);
    const [noticeForm,setNoticeForm] = useState({});

    useEffect(() => {
      if (token && id) fetchData();
    }, [id, token]);

    useEffect(() => {
      if (token && id) fetchDemandData();
    }, [id, token]);

    const fetchData = async ()=>{
        setIsFrozen(true);
        try{
            const response = await axios.post(propertyNoticeListApi,
                {id},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if(response?.data?.status){
                setNoticeList(response?.data?.data);
            } 
        }catch(error){

        }finally{
           setIsFrozen(false); 
        }
    }

    const fetchDemandData = async () => {
      setIsFrozen(true);
      try {
        const response = await axios.post(
          propDueApi,
          { id },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response?.data?.status) {
          setDemandData(response.data.data || {});
        }
      } catch (error) {
        console.error("Error fetching demand:", error);
      } finally {
        setIsFrozen(false);
      }
    };

    const handelChange = (e)=>{
        const {name,value,type,checked} = e.target;
        setNoticeForm((prev)=>({...prev,[name]:value}));
    }

    const generateNotice = async()=>{
      setIsFrozen(true);
      try{
        const response = await axios.post(propertyGenerateNoticeApi,
                {...noticeForm,id},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
              );
        if(response?.data?.status){
          toastMsg(response?.data?.message,"success");
          fetchData();
        }else{
          toastMsg(response?.data?.message,"error");
        }

      }catch(error){
        console.log("error",error);
      }finally{
        setIsFrozen(false);
      }
    }

    const openNotice = (item)=>{
      setIsNoticeViewModal(true);
      setNoticeId(item?.id);
    }

    const closeNotice = ()=>{
      setIsNoticeViewModal(false);
      setNoticeId(null);
    }

    // 🔥 Added Missing Function
    const deactivateNotice = async (item) => {
        try {
            setIsFrozen(true);
            const response = await axios.post(
                propertyNoticeDeactivateApi,
                { id: item?.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response?.data?.status) {
                toastMsg("Deactivated Successfully", "success");
                fetchData();
            } else {
                toastMsg(response?.data?.message, "error");
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsFrozen(false);
        }
    };


  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={modalVariants}
        transition={{ duration: 0.5 }}
        className="flex flex-col bg-white shadow-lg p-6 rounded-lg w-full max-w-6xl max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-blue-900 text-xl">Notice Detail</h2>
          <button
            className="text-gray-600 hover:text-red-600"
            onClick={onClose}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Table Content */}
        <div className="relative flex-grow overflow-y-auto">
          <div className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""}`}>

            {/* Demand Details */}
            <div className={`${!demandData ? "pointer-events-none filter blur-sm" : ""} border rounded-lg shadow bg-white`}>
                <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg text-lg font-semibold">
                Demand Details
                </div>

                <div className="overflow-x-auto p-4">
                <table className="w-full border text-sm">
                    <thead className="bg-gray-200">
                    <tr>
                        <th className="border px-3 py-2">Demand From</th>
                        <th className="border px-3 py-2">Demand Upto</th>
                        <th className="border px-3 py-2">Demand (In Rs.)</th>
                        <th className="border px-3 py-2">RWH Penalty (In Rs.)</th>
                        <th className="border px-3 py-2">Already Paid (In Rs.)</th>
                        <th className="border px-3 py-2">Total (In Rs.)</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr>
                        <td className="border px-3 py-2">{demandData?.fromQtr} / {demandData?.fromFyear}</td>
                        <td className="border px-3 py-2">{demandData?.uptoQtr} / {demandData?.uptoFyear}</td>
                        <td className="border px-3 py-2">{demandData?.demandAmount}</td>
                        <td className="border px-3 py-2">{demandData?.rwhAmount}</td>
                        <td className="border px-3 py-2">{demandData?.advanceAmount}</td>
                        <td className="border px-3 py-2 font-semibold">{demandData?.demandAmount}</td>
                    </tr>
                    </tbody>

                    <tfoot>
                    <tr>
                        <td colSpan="2" className="border px-3 py-2 font-semibold">Total</td>
                        <td className="border px-3 py-2 font-semibold">{demandData?.demandAmount}</td>
                        <td className="border px-3 py-2 font-semibold">{demandData?.rwhAmount}</td>
                        <td className="border px-3 py-2">{demandData?.advanceAmount}</td>
                        <td className="border px-3 py-2 font-semibold">{demandData?.demandAmount}</td>
                    </tr>
                    </tfoot>
                </table>

                <div className="mt-4 text-sm">
                    <div className="flex justify-between border px-3 py-2">
                    <span>1% Interest</span>
                    <span className="font-semibold">Rs. {demandData?.monthlyPenalty}</span>
                    </div>

                    <div className="flex justify-between border px-3 py-2">
                    <span>Rebate</span>
                    <span className="font-semibold">
                      Rs. { (parseFloat(demandData?.specialRebate) || 0) + (parseFloat(demandData?.rebateAmount) || 0) }
                    </span>
                    </div>

                    <div className="flex justify-between border px-3 py-2 bg-gray-100">
                    <span className="font-semibold">Total Payable</span>
                    <span className="font-bold text-green-700">Rs. {demandData?.payableAmount}</span>
                    </div>

                    <div className="border px-3 py-2 text-sm italic">
                    <strong>Total Demand (in words):</strong>  
                    <br />
                    <span>{demandData?.payableAmountInWord}</span>
                    </div>
                </div>
                </div>
            </div>

            {/* Notice Form */}
            <div className="border rounded-lg shadow bg-white mt-6">
                <div className="bg-blue-900 text-white px-4 py-2 rounded-t-lg text-lg font-semibold">
                Notice Form
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Notice Date */}
                <div className="flex flex-col">
                    <label className="font-semibold mb-1">Notice Date *</label>
                    <input
                    type="date"
                    name='noticeDate'
                    value={noticeForm?.noticeDate || ""}
                    onChange={handelChange}
                    className="border px-3 py-2 rounded w-full"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="font-semibold mb-1">Notice Type</label>
                    <select
                    name='noticeType'
                    value={noticeForm?.noticeType || ""}
                    onChange={handelChange}
                    className="border px-3 py-2 rounded w-full"
                    >
                    <option value="">SELECT</option>
                    <option value="Demand">Demand</option>
                    <option value="Assessment">Assessment</option>
                    </select>
                </div>

                {/* Button */}
                <div className="flex items-end">
                    <button 
                      className={`${
                        permissionSet?.canGenerateNotice
                          ? " bg-yellow-400 text-white hover:bg-yellow-200 "
                          : "bg-gray-500 text-white hover:bg-gray-400"
                      } px-5 py-2 rounded w-full`}
                      disabled={!permissionSet?.canGenerateNotice}
                      onClick={generateNotice}
                    >
                    Generate Notice
                    </button>
                </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="border rounded min-w-full overflow-hidden text-sm text-left">
                <thead className="top-0 z-10 sticky bg-blue-800 text-white">
                  <tr>
                    <th className="p-2 border">#</th>
                    <th className="p-2 border">Notice Type</th>
                    <th className="p-2 border">Notice No</th>
                    <th className="p-2 border">Notice Date</th>
                    <th className="p-2 border">Generate Date</th>
                    <th className="p-2 border">Generate By</th>
                    <th className="p-2 border">Notice Serve Date</th>
                    <th className="p-2 border">Served By</th>
                    <th className="p-2 border">Receiving</th>
                    <th className="p-2 border">Action</th>
                  </tr>                  
                </thead>
                <tbody>
                  {noticeList.length > 0 ? (
                    <>
                      {noticeList.map((item, index) => (
                        <tr key={index} className="even:bg-gray-50 odd:bg-white border-t">
                          <td className="p-2 border text-center">{index + 1}</td>
                          <td className="p-2 border text-center">{item?.noticeType}</td>
                          <td className="p-2 border text-center">{item?.noticeNo}</td>
                          <td className="p-2 border text-center">{formatLocalDate(item?.noticeDate)}</td>
                          <td className="p-2 border text-center">{formatLocalDateTime(item?.createdAt)}</td>
                          <td className="p-2 border text-center">{item?.generatedByUserName}</td>

                          <td className="p-2 border text-center">{formatLocalDateTime(item?.servedAt)}</td>
                          <td className="p-2 border text-center">{item?.servedByUserName}</td>
                          <td className="p-2 border text-center">{item?.receivingStatus}</td>
                          
                          <td className="p-2 border text-center space-x-2">
                            <Button size="sm" onClick={() => openNotice(item)}>
                                View
                            </Button>
                            {permissionSet?.canGenerateNotice &&(
                                <Button 
                                    className="bg-red-500 text-white" 
                                    size="sm" 
                                    onClick={() => deactivateNotice(item)}
                                >
                                    Deactivate
                                </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : (
                    <tr>
                      <td colSpan="21" className="p-4 text-gray-500 text-center">
                        No documents found.
                      </td>
                    </tr>
                  )}
                </tbody>                
              </table>
            </div>
          </div>

          {/* Frozen Overlay */}
          {isFrozen && (
            <div className="z-10 absolute inset-0 flex justify-center items-center bg-white/60 backdrop-blur-sm">
              <div className="font-semibold text-gray-800 text-lg">
                Processing...
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {isNoticeViewModal &&(
        <NoticeViewModal id={noticeId} onClose={closeNotice} />
      )}
    </div>
  )
}

export default GenerateNoticeModal;
