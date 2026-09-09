import { useState } from "react";
import axios from "axios";
import { safGeoTagApi } from "../../../../api/endpoints";
import { getToken } from "../../../../utils/auth";
import { useNavigate, useParams } from "react-router-dom";
import { toTitleCase } from "../../../../utils/common";
import toast from "react-hot-toast";

const GeoTagImageUpload = ({ hasWaterHarvesting = false }) => {
  const { safDtlId } = useParams();
  const token = getToken();
  const navigate = useNavigate();

  const [uploads, setUploads] = useState([
    { preview: null, lat: "", lng: "", file: null, direction: "front side" },
    { preview: null, lat: "", lng: "", file: null, direction: "left side" },
    { preview: null, lat: "", lng: "", file: null, direction: "right side" },
  ]);

  const [waterHarvest, setWaterHarvest] = useState({
    preview: null,
    lat: "",
    lng: "",
    file: null,
    direction: "Water Harvesting",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (index, file) => {
    if (!file) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const updated = [...uploads];
          updated[index] = {
            ...updated[index],
            preview: URL.createObjectURL(file),
            file,
            lat,
            lng,
          };
          setUploads(updated);
        },
        () => {
          toast.error("Could not get location.");
        }
      );
    }
  };

  const handleWaterHarvestChange = (file) => {
    if (!file) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWaterHarvest({
            preview: URL.createObjectURL(file),
            file,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            direction: "Water Harvesting",
          });
        },
        () => {
          toast.error("Could not get location.");
        }
      );
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("id", safDtlId);

      uploads.forEach((item, idx) => {
        if (item.file) {
          formData.append(`geoTag[${idx}][direction]`, item.direction);
          formData.append(`geoTag[${idx}][document]`, item.file);
          formData.append(`geoTag[${idx}][latitude]`, item.lat);
          formData.append(`geoTag[${idx}][longitude]`, item.lng);
        }
      });

      if (hasWaterHarvesting && waterHarvest.file) {
        const idx = uploads.length; // water harvest as next geoTag index
        formData.append(`geoTag[${idx}][direction]`, waterHarvest.direction);
        formData.append(`geoTag[${idx}][document]`, waterHarvest.file);
        formData.append(`geoTag[${idx}][latitude]`, waterHarvest.lat);
        formData.append(`geoTag[${idx}][longitude]`, waterHarvest.lng);
      }

      const res = await axios.post(safGeoTagApi, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.status) {
        toast.success(res?.data?.message || "GeoTag Done");
        // reset
        setUploads([
          {
            preview: null,
            lat: "",
            lng: "",
            file: null,
            direction: "front side",
          },
          {
            preview: null,
            lat: "",
            lng: "",
            file: null,
            direction: "left side",
          },
          {
            preview: null,
            lat: "",
            lng: "",
            file: null,
            direction: "right side",
          },
        ]);
        setWaterHarvest({
          preview: null,
          lat: "",
          lng: "",
          file: null,
          direction: "Water Harvesting",
        });
        navigate("/mobile/saf/inbox");
      } else {
        toast.error(res?.data?.message || "Server Error");
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  // new: calculate if all required images are uploaded
  const allImagesUploaded =
    uploads.every((item) => item.file !== null) &&
    (!hasWaterHarvesting || (hasWaterHarvesting && waterHarvest.file !== null));

  return (
    <div className="mx-auto p-4 max-w-4xl">
      <h2 className="mb-4 font-bold text-xl">Geo-tagged Image Upload</h2>

      <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {uploads.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center bg-white shadow p-4 border rounded"
          >
            <h3 className="mb-2 font-semibold text-lg">
              {toTitleCase(item.direction)}
            </h3>

            {item.preview ? (
              <img
                src={item.preview}
                alt="preview"
                className="mb-2 rounded w-32 h-32 object-cover"
              />
            ) : (
              <div className="flex justify-center items-center mb-2 border rounded w-32 h-32 text-gray-400">
                No Image
              </div>
            )}

            <div className="mb-2 text-gray-600 text-xs text-center">
              <strong>Latitude:</strong> {item.lat || "N/A"} <br />
              <strong>Longitude:</strong> {item.lng || "N/A"}
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(index, e.target.files[0])}
              className="p-1 border w-full text-xs"
            />
          </div>
        ))}

        {hasWaterHarvesting && (
          <div className="flex flex-col items-center bg-white shadow p-4 border rounded">
            <h3 className="mb-2 font-semibold text-lg">Water Harvesting</h3>

            {waterHarvest.preview ? (
              <img
                src={waterHarvest.preview}
                alt="Water Harvesting"
                className="mb-2 rounded w-32 h-32 object-cover"
              />
            ) : (
              <div className="flex justify-center items-center mb-2 border rounded w-32 h-32 text-gray-400">
                No Image
              </div>
            )}

            <div className="mb-2 text-gray-600 text-xs text-center">
              <strong>Latitude:</strong> {waterHarvest.lat || "N/A"} <br />
              <strong>Longitude:</strong> {waterHarvest.lng || "N/A"}
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleWaterHarvestChange(e.target.files[0])}
              className="p-1 border w-full text-xs"
            />
          </div>
        )}
      </div>

      {/* conditionally render submit button */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full sm:w-auto mt-6 
                ${
                  allImagesUploaded && !submitting
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-400 text-white cursor-not-allowed"
                } 
                px-4 py-2 rounded shadow`}
      >
        {submitting ? "Submitting..." : "Submit All"}
      </button>
    </div>
  );
};

export default GeoTagImageUpload;
