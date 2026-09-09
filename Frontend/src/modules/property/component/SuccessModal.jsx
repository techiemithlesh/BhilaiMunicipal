import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalFooter,
  Button,
} from "@nextui-org/react";

const SuccessModal = ({
  isOpen,
  onClose,
  title = "Success",
  message = "Operation completed successfully.",
  buttonText = "OK",
  onConfirm,
  showSecondaryButton = false,
  secondaryButtonText = "Upload Documents",
  onSecondaryAction,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} backdrop="opaque">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="font-bold text-lg">{title}</ModalHeader>
            <ModalBody>
              <p className="text-gray-700 text-sm">{message}</p>
            </ModalBody>
            <ModalFooter className="flex justify-end space-x-2">
              {showSecondaryButton && (
                <Button
                  color="warning"
                  onClick={() => {
                    if (onSecondaryAction) onSecondaryAction();
                  }}
                >
                  {secondaryButtonText}
                </Button>
              )}
              <Button
                color="primary"
                onClick={() => {
                  onClose();
                  if (onConfirm) onConfirm();
                }}
              >
                {buttonText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SuccessModal;
