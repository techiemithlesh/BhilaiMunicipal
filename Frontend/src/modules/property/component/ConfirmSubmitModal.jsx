import { useState } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
  Checkbox,
} from "@nextui-org/react";

const ConfirmSubmitModal = ({
  isOpen,
  onClose,
  title = "Confirm Submission",
  message = "Please review the details above before submitting.",
  confirmText = "I declare that the information given above is true and correct to the best of my knowledge.",
  buttonText = "Confirm & Submit",
  onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmed(false);
        onClose();
      }}
      backdrop="opaque"
    >
      <ModalContent>
        <ModalHeader className="justify-center font-bold text-lg">
          {title}
        </ModalHeader>
        <ModalBody>
          <p className="text-gray-700 text-sm text-center">{message}</p>
        </ModalBody>
        <ModalFooter>
          <div className="flex flex-col items-center justify-center gap-4 w-full">
            <Checkbox isSelected={confirmed} onValueChange={setConfirmed}>
              {confirmText}
            </Checkbox>
            <Button
              color="primary"
              className="mx-auto"
              isDisabled={!confirmed}
              onClick={() => {
                setConfirmed(false);
                if (onConfirm) onConfirm();
              }}
            >
              {buttonText}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmSubmitModal;
