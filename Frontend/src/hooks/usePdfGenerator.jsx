import { useState, useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const usePdfGenerator = (printRef) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [filename, setFilename] = useState("payment-receipt");
  const resolveRef = useRef(null);

  // Open modal and return a Promise that resolves with the filename
  const handleOpenModal = () =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      onOpen();
    });

  const generatePdf = async () => {
    if (!printRef.current) return;

    const finalFilename = await handleOpenModal();
    if (!finalFilename) return; // user cancelled

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${finalFilename}.pdf`);
  };

  const FileNameModal = () => (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      className="backdrop-blur-md rounded-2xl max-w-md"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col items-center gap-2">
              <h4 className="m-0 w-full font-bold text-blue-700 text-lg text-center">
                Enter PDF Filename
              </h4>
            </ModalHeader>
            <ModalBody className="flex flex-col gap-6">
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g., payment-receipt"
                autoFocus
                clearable
                bordered
                size="lg"
                fullWidth
                classNames={{
                  inputWrapper: "border-2 border-blue-400 rounded-xl",
                  input: "text-base font-semibold",
                }}
              />
              <p className="text-gray-500 text-sm text-center">
                This will be the name of your downloaded PDF file.
              </p>
            </ModalBody>
            <ModalFooter className="flex justify-between">
              <Button
                variant="bordered"
                color="danger"
                className="rounded-full h-8 font-semibold"
                onPress={() => {
                  resolveRef.current(null);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                color="primary"
                className="rounded-full h-8 font-semibold"
                onPress={() => {
                  resolveRef.current(filename.trim() || "payment-receipt");
                  onClose();
                }}
              >
                Generate PDF
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  return { generatePdf, FileNameModal };
};
