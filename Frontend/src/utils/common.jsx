import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useReactToPrint } from 'react-to-print';

export const formatTimeAMPM = (dateStr) => {
  const date = new Date(dateStr);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours %= 12;
  hours = hours || 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  return `${hours}:${minutes} ${ampm}`;
};

export const formatLocalDateTime = (dateStr,separator="/") => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}${separator}${month}${separator}${year} ${hours}:${minutes}:${seconds}`;
};
export const formatLocalDate = (dateStr,separator="/") => {
  if (!dateStr) return "N/A";
  
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}${separator}${month}${separator}${year}`;

};

export const formatReadableDate = (dateStr) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};
export const formatReadableYearMonth = (dateStr) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Invalid Date";

  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return `${month}-${year}`;
};

export const formatYearMonth = (dateStr) => {
  if (!dateStr) return "N/A";
  
  const parts = dateStr.split('-');
  if (parts.length < 2) return dateStr; // Return as is if it can't be split

  const year = parts[0];
  const month = parts[1].padStart(2, "0");
  
  return `${year}-${month}`;
};


export const toTitleCase = (str) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const hostInfo = () => {
  const host = window.location.host;
  const protocol = window.location.protocol;
  return `${protocol}//${host}`;
};

export function getPermissionsByUrl(url) {
  const userInfo = JSON.parse(localStorage.getItem("userDetails") || "{}");
  const permittedMenu = userInfo.permittedMenu || [];
  const matchedMenu = permittedMenu.find((menu) => menu.url === url);

  return {
    read: matchedMenu?.read ?? false,
    write: matchedMenu?.write ?? false,
    update: matchedMenu?.update ?? false,
    delete: matchedMenu?.delete ?? false,
  };
}

export function extractDateYYMM(date) {
  const dateStr = new Date(date);
  const month =
    dateStr.getMonth() > 9 ? dateStr.getMonth() : `0${dateStr.getMonth()}`;
  return `${dateStr.getFullYear()}-${month}`;
}

export const buildFilterQueryString = (obj) => {
  const params = new URLSearchParams();
  for (const key in obj) {
    if (Array.isArray(obj[key])) {
      obj[key].forEach((val) => params.append(`${key}[]`, val));
    } else if (obj[key]) {
      params.set(key, obj[key]);
    }
  }
  return params.toString();
};

export const getShortRole = (role = null) => {
  return role
    ? role.length > 3
      ? role
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .toUpperCase()
      : role
    : "NA";
};

export const statusColor=(status="")=>{
    const statusStr = String(status); 

    if (/Approved/i.test(statusStr)) {
        return "text-[#30843aaa]" ;
    }
    if (/Back To Citizen|BTC/i.test(statusStr)) {
        return "text-[#e60d0db3]" ;
    }
    if (/Not/i.test(statusStr)) {
        return "text-[#3969b8b3]" ;
    }
    
    if (/Pending/i.test(statusStr)) {
        return "text-[#71326db3]" ;
    }
    return "text-[#282628b3]" ;
}

export const handleGeneratePdf = async (printRef,name="payment-receipt") => {
  if (!printRef.current) return;

  // Use a prompt to ask the user for a filename
  const filename = prompt(
    "Enter a filename for your receipt:",
    name
  );

  // If the user cancels the prompt, exit the function
  if (filename === null || filename.trim() === "") {
    return;
  }

  // Use html2canvas to capture the content as an image (canvas)
  const canvas = await html2canvas(printRef.current, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 295; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let position = 0;

  // Add the image to the PDF
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Handle multiple pages if the content is longer than one page
  while (heightLeft >= 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Save the PDF with the user-provided filename
  pdf.save(`${filename}.pdf`);
};

export const usePrint = (receiptRef, name = "payment-receipt") => {
  const print = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: name,
  });

  const handlePrintSafe = () => {
    if (!receiptRef?.current) {
      console.error("Nothing to print – receipt DOM not mounted");
      return;
    }
    print();
  };

  return handlePrintSafe;
};


export const toDataURL = async (url) => {
  try {
    console.log("url", (url));
    if (!url) return null;
    const modifiedUrl = url.replace(/(https?:\/\/[^/]+)/, "$1/logo");

    console.log("Modified URL:", modifiedUrl);


    // Important: tell axios to return binary data
    const res = await axios.get(modifiedUrl, { responseType: "blob" });

    const blob = res.data; // axios stores the blob in res.data

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("toDataURL error:", error);
    return null;
  }
};
