import React, { useEffect, useState } from "react";
import axios from "axios";
import QRCodeComponent from "../../../components/common/QRCodeComponent";
import { toDataURL, hostInfo } from "../../../utils/common";
import { tradeLicenseReceiptApi } from "../../../api/endpoints";

function LicenseCertificateDtl({ data=null,id, setIsFrozen }) {
  const [logoBase64, setLogoBase64] = useState(null);
  const [signatureBase64, setSignatureBase64] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchData();
    return () => {
      setIsFrozen(false);
      setLogoBase64(null);
      setQrCode(null);
      setSignatureBase64(null);
    };
  }, [id]);

  const fetchData = async () => {
    setIsFrozen(true);

    try {
      let finalData = data;

      // FETCH FROM API IF data NOT PASSED
      if (!data) {
        const res = await axios.post(tradeLicenseReceiptApi, { id });

        if (res?.data?.status) {
          finalData = res.data.data;
        }
      }

      if (!finalData) return;

      setReceiptData(finalData);

      /** LOAD LOGO **/
      if (finalData.ulbDtl?.logoImg) {
        const logo = await toDataURL(finalData.ulbDtl.logoImg);
        setLogoBase64(logo);
      }

      /** LOAD SIGNATURE **/
      if (finalData.userDtl?.signatureImg) {
        const sign = await toDataURL(finalData.userDtl.signatureImg);
        setSignatureBase64(sign);
      }

      /** GENERATE QR **/
      const host = hostInfo();
      setQrCode(
        <QRCodeComponent
          value={`${host}/municipal-license-receipt/${id}`}
          size={110}
        />
      );
    } catch (error) {
      console.error("Certificate load error:", error);
    } finally {
      setIsFrozen(false);
    }
  };

  if (!receiptData) {
    return <div className="p-10 text-center text-gray-500">Loading…</div>;
  }

  return (
    <div className="bg-white p-6 border-4 border-red-600 border-dotted font-sans text-sm leading-6">

      {/* HEADER */}
      <div className="text-center mb-4 relative">

        {/* ULB LOGO */}
        {logoBase64 && (
          <img
            src={logoBase64}
            className="w-20 h-20 mx-auto mb-2"
            alt="ULB Logo"
          />
        )}

        {receiptData?.ulbDtl?.hindiUlbName && (
          <h2 className="font-bold text-lg">{receiptData?.ulbDtl.hindiUlbName}</h2>
        )}

        <h2 className="font-bold text-xl">{receiptData?.ulbDtl?.ulbName}</h2>

        <h3 className="mt-1 font-semibold">
          Municipal License
        </h3>

        <p className="text-xs mt-1">
          (This certificate relates to Section 455(i) Jharkhand Municipal Act 2011)
        </p>
      </div>

      {/* QR & DETAILS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

        {/* LEFT DETAILS */}
        <div>
          <p>
            Municipal Trade Licence Number :
            <b className="ml-1 text-red-600">{receiptData?.licenseNo}</b>
          </p>

          <p>
            Issue date of Municipal Trade Licence :
            <b className="ml-1">{receiptData?.licenseDate}</b>
          </p>

          <p>
            Validity of Municipal Trade Licence :
            <b className="ml-1">{receiptData?.validUpto}</b>
          </p>

          <p>Owner/ Entity Name : <b>{receiptData?.firmName}</b></p>
          <p>Owner Name of Entity : <b>{receiptData?.ownerName}</b></p>
          <p>Nature of Entity : <b>{receiptData?.firmDescription}</b></p>
          <p>Ownership of business premises : <b>{receiptData?.premisesOwnerName}</b></p>
          <p>Business code : <b>({receiptData?.businessCode})</b></p>

          <p>Date of Establishment : <b>{receiptData?.licenseDate}</b></p>
        </div>

        {/* QR + META */}
        <div className="flex flex-col items-center">
          <div className="border w-28 h-28 flex items-center justify-center">
            {qrCode}
          </div>

          <p className="mt-3">Ward No. : <b>{receiptData?.wardNo}</b></p>
          <p>Holding No. : <b>{receiptData?.holdingNo}</b></p>
          <p>Street Address : <b>{receiptData?.address}</b></p>
          <p>Application No. : <b>{receiptData?.applicationNo}</b></p>
          <p>Date & Time of Application : <b>{receiptData?.licenseDate}</b></p>
          <p>Mobile No. : <b>{receiptData?.mobileNo}</b></p>
        </div>
      </div>

      {/* DECLARATION */}
      <div className="mt-6">
        <p>
          This is to declare that <b>{receiptData?.firmName}</b> having application number{" "}
          <b>{receiptData?.applicationNo}</b> has been successfully registered with us with
          satisfactory compliance of registration criteria and to certify that trade
          licence number <b>{receiptData?.licenseNo}</b> has been allocated to{" "}
          <b>{receiptData?.firmName}</b> for conducting business in the regime of this local body.
        </p>

        <p className="mt-2">
          The validity of this subject to meeting the terms and conditions as
          specified in U/S 455 of Jharkhand Municipal Act 2011 along with
          following terms and conditions:-
        </p>
      </div>

      {/* RULES (exact as sample) */}
      <ol className="mt-4 list-decimal list-inside space-y-1">
        <li>The business will run according to the license issued.</li>
        <li>Prior Permission from the local body is necessary if the business is changed.</li>
        <li>Information to the local body is necessary for the extension of the area.</li>
        <li>Prior Information to local body regarding winding of business is necessary.</li>
        <li>
          Application for renewal of the license is necessary one month before
          the expiry of the license.
        </li>
        <li>
          In case of delay, a penalty will be levied according to rule 259 of the
          Jharkhand Municipal Act 2011.
        </li>
        <li>Illegal Parking in front of the firm is non-permissible.</li>
        <li>
          A Sufficient number of containers for disposing of garbage & refuse shall
          be made available in the premises and the license will co-operate with
          the ULB for disposal of such waste.
        </li>
        <li>
          SWM Rules, 2016 and Plastic Waste Management Rules 2016 shall be adhered
          to in words as well as spirit.
        </li>
      </ol>

      {/* NOTE */}
      <p className="mt-4 text-xs text-gray-600">
        Note: This is a computer generated Licence. This Licence does not require a physical signature.
      </p>

      {/* SIGNATURE */}
      <div className="flex justify-end mt-10">
        <div className="text-right">
          <div className="h-10" />
          <p className="font-semibold text-sm">Signature :</p>
          {signatureBase64 && (
          <img
            src={signatureBase64}
            className="w-20 h-20 mx-auto mb-2"
            alt="ULB Logo"
          />
        )}
        </div>
      </div>
    </div>
  );
}

export default LicenseCertificateDtl;
