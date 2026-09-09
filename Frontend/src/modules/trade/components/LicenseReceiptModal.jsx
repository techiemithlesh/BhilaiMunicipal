import { useEffect, useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

const LicenseReceiptModal = ({ id, apiUrl, token, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // FETCH CERTIFICATE DATA
  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const res = await axios.post(
          apiUrl,
          { id },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res?.data?.status) setData(res.data.data);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [id, apiUrl, token]);

  // ESC CLOSE
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // DISABLE BACKGROUND SCROLL
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 
        MAIN MODAL:
        - max-h ensures big certificates scroll
        - overflow-y-auto ensures no content cut 
      */}
      <div
        className="relative bg-white w-full max-w-[1100px] max-h-[93vh] overflow-y-auto rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE BUTTON */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-red-600 print:hidden"
          onClick={onClose}
        >
          <FaTimes size={22} />
        </button>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 text-center text-gray-500">
            Loading certificate...
          </div>
        )}

        {/* NO DATA */}
        {!loading && !data && (
          <div className="py-20 text-center text-gray-500">No data found.</div>
        )}

        {/* CONTENT */}
        {!loading &&
          data &&
          (() => {
            const {
              wardNo,
              newWardNo,
              holdingNo,
              licenseNo,
              applicationNo,
              licenseDate,
              validUpto,
              applyDate,
              firmName,
              firmDescription,
              premisesOwnerName,
              address,
              ownerName,
              mobileNo,
              businessCode,
              ulbDtl,
            } = data;

            return (
              <div id="print-area" className="p-6">
                {/* OUTER DOTTED BORDER LIKE SAMPLE */}
                <div className="border-4 border-red-600 border-dotted p-6">

                  {/* PRINT BUTTON */}
                  <div className="flex justify-end mb-4 print:hidden">
                    <button
                      onClick={() => window.print()}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                      Print
                    </button>
                  </div>

                  {/* GOVT LOGO + ULB INFO */}
                  <div className="text-center mb-4">
                    {/* Dummy Logo */}
                    <div className="w-20 h-20 mx-auto mb-2">
                      {ulbDtl?.logoImg ? (
                        <img
                          src={ulbDtl.logoImg}
                          className="w-full h-full object-contain"
                          alt="ULB Logo"
                        />
                      ) : (
                        <div className="w-full h-full border flex items-center justify-center text-xs">
                          LOGO
                        </div>
                      )}
                    </div>

                    <h2 className="font-bold text-lg">
                      Municipal Trade Licence Approval Certificate
                    </h2>

                    <h3 className="font-bold text-red-700 text-xl mt-1">
                      {ulbDtl?.ulbName}
                    </h3>

                    <h4 className="font-semibold mt-1">Municipal License</h4>

                    <p className="text-sm text-gray-700 mt-1">
                      (This certificate relates to Section 455(i) Jharkhand Municipal Act 2011)
                    </p>
                  </div>

                  {/* TOP GRID: LEFT DETAILS + QR */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 text-sm leading-7">

                    {/* LEFT DETAILS */}
                    <div>
                      <p>
                        Municipal Trade Licence Number :
                        <b className="ml-1 text-red-600">{licenseNo}</b>
                      </p>

                      <p>
                        Issue Date of Municipal Trade Licence :
                        <b className="ml-1">{licenseDate}</b>
                      </p>

                      <p>
                        Validity of Municipal Trade Licence :
                        <b className="ml-1">{validUpto}</b>
                      </p>

                      <p>
                        Owner / Entity Name : <b>{firmName}</b>
                      </p>

                      <p>
                        Owner Name of Entity : <b>{ownerName}</b>
                      </p>

                      <p>
                        Nature of Entity : <b>{firmDescription}</b>
                      </p>

                      <p>
                        Ownership of business premises :
                        <b className="ml-1">{premisesOwnerName}</b>
                      </p>

                      <p>
                        Business Code : <b>({businessCode})</b>
                      </p>

                      <p>
                        Date of Establishment : <b>{licenseDate}</b>
                      </p>
                    </div>

                    {/* QR + RIGHT DETAILS */}
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-28 border border-gray-700 flex items-center justify-center">
                        QR CODE
                      </div>

                      <p className="mt-3">
                        Ward No. : <b>{wardNo || newWardNo}</b>
                      </p>
                      <p>
                        Holding No. : <b>{holdingNo}</b>
                      </p>
                      <p>
                        Street Address : <b>{address}</b>
                      </p>
                      <p>
                        Application No. : <b>{applicationNo}</b>
                      </p>
                      <p>
                        Date & Time of Application : <b>{applyDate}</b>
                      </p>
                      <p>
                        Mobile No. : <b>{mobileNo}</b>
                      </p>
                    </div>
                  </div>

                  {/* MAIN DECLARATION */}
                  <p className="mt-6 text-sm leading-7">
                    This is to declare that <b>{firmName}</b> having application
                    number <b>{applicationNo}</b> has been successfully
                    registered with us with satisfactory compliance of
                    registration criteria and to certify that trade licence
                    number <b>{licenseNo}</b> has been allocated to
                    <b className="ml-1">{firmName}</b> for conducting business
                    which is ( ) as per business code mentioned in Jharkhand
                    Municipal Act 2011 in the regime of this local body. The
                    validity of this subject to meeting the terms and conditions
                    as specified in U/S 455 of Jharkhand Municipal Act 2011
                    and other applicable sections in the act along with
                    following terms and conditions:-
                  </p>

                  {/* RULES */}
                  <ol className="mt-6 text-sm list-decimal list-inside space-y-1">
                    <li>The business will run according to the license issued.</li>
                    <li>Prior Permission from the local body is necessary if the business is changed.</li>
                    <li>Information to the local body is necessary for the extension of the area.</li>
                    <li>Prior Information to local body regarding winding of business is necessary.</li>
                    <li>Application for renewal of the license is necessary one month before expiry.</li>
                    <li>In case of delay, penalty will be levied as per rule 259.</li>
                    <li>Illegal Parking in front of the firm is non-permissible.</li>
                    <li>
                      Sufficient number of containers for garbage disposal shall be provided & 
                      cooperation with ULB is mandatory.
                    </li>
                    <li>
                      SWM Rules 2016 & Plastic Waste Management Rules 2016 shall be followed strictly.
                    </li>
                  </ol>

                  {/* FOOTER NOTE */}
                  <p className="mt-6 text-xs">
                    Note: This is a computer-generated Licence. This Licence does not require a physical signature.
                  </p>

                  {/* SIGNATURE */}
                  <div className="flex justify-end mt-10 pr-4">
                    <div className="text-right">
                      <div className="h-10" />
                      <p className="font-semibold text-sm">Signature :</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export default LicenseReceiptModal;
