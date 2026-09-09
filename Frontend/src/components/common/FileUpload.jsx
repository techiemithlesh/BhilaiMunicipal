import { FilePond, registerPlugin } from "react-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFilePoster from 'filepond-plugin-file-poster'; 

// Register plugins
registerPlugin(FilePondPluginImagePreview,FilePondPluginFileValidateType,FilePondPluginFilePoster);

const FileUpload = ({
  files = [],
  setFiles = () => {},
  name = "file",
  allowMultiple = false,
  maxFiles = 1,
  label = "Drop your file or Browse",
  acceptedFileTypes = ['.pdf'], // [] = all types
  server = null,
  className = "", // optional styling
  required = false,
}) => {
  const mimeTypeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
    '.mp4': 'video/mp4',
  };
  const mimeType = acceptedFileTypes.map((ext)=>{
    return mimeTypeMap[ext]||ext;
  });


  return (
    <div className={className}>
      <FilePond
        name={name}
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={allowMultiple}
        maxFiles={maxFiles}
        acceptedFileTypes={mimeType}
        server={server}
        labelIdle={label}
        className="filepond"
      />
    </div>
  );
};

export default FileUpload;
