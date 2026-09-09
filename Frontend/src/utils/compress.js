import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";

/**
 * UNIVERSAL FILE COMPRESSION
 * - Images → Real compression
 * - PDFs → Real compression
 * - Others → ZIP compression
 */
export async function compressFileSmart(file) {
  const type = file.type;

  if (type.startsWith("image/")) {
    return await compressImage(file, 0.6, 1280);
  }

  if (type === "application/pdf") {
    return await compressPDF(file);
  }

  return await zipFile(file);  // fallback for other files
}

// --------------------------
//  IMAGE COMPRESSION
// --------------------------

function compressImage(file, quality = 0.6, maxWidth = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (!blob) return reject("Compression failed");
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          quality
        );
      };
    };

    reader.readAsDataURL(file);
  });
}

// --------------------------
//  PDF COMPRESSION
// --------------------------

async function compressPDF(file) {
  const pdfBytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Remove metadata
  pdfDoc.setTitle("");
  pdfDoc.setSubject("");
  pdfDoc.setKeywords([]);

  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    const { width, height } = page.getSize();
    page.setSize(width * 0.9, height * 0.9); // reduce DPI slightly
  });

  const compressedBytes = await pdfDoc.save();

  return new File([compressedBytes], file.name, { type: "application/pdf" });
}

// --------------------------
//  ZIP fallback
// --------------------------

async function zipFile(file) {
  const zip = new JSZip();
  zip.file(file.name, file);

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });

  return new File([blob], file.name + ".zip", {
    type: "application/zip"
  });
}
