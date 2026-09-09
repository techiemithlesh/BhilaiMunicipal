import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { publicOfficerApi } from "../../api/endpoints";
import defaultAvatar from "../../assets/images/default-avatar.jpg";
import ImagePreview from "../common/ImagePreview";

import { FaPhoneAlt, FaEnvelope, FaUserTie } from "react-icons/fa";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const OfficerList = () => {
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalPreviewOpen, setIsModalPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState("");
  const [pause, setPause] = useState(false);

  const listRef = useRef(null);
  const [scrollHeight, setScrollHeight] = useState(0);

  // Fetch Officers
  useEffect(() => {
    const fetchOfficers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(publicOfficerApi, {
          ulbId,
          all: true,
        });

        if (response?.data?.status) setOfficers(response.data.data);
      } catch (error) {
        console.log("error", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  useEffect(() => {
    if (listRef.current) {
      setScrollHeight(listRef.current.scrollHeight);
    }
  }, [officers]);

  // Duplicate list once + add blank spacer at end
  const scrollingList = [...officers, { blank: true },...officers];

  const openPreviewModel = (link) => {
    setIsModalPreviewOpen(true);
    setPreviewImg(link);
  };

  const closePreviewModel = () => {
    setIsModalPreviewOpen(false);
    setPreviewImg("");
  };

  return (
      <div
        className="h-[300px] overflow-hidden rounded-lg border bg-white shadow relative"
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => setPause(false)}
      >
        {isLoading ? (
          <div className="flex justify-center items-center h-full py-10">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-700 text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <h2 className="text-xl md:text-2xl font-bold text-center border-b py-2 bg-white z-20 relative h-[50px]">
              Key Contacts
            </h2>

            {/* SCROLL AREA */}
            <div
              ref={listRef}
              className={`absolute top-[55px] left-0 w-full flex flex-col gap-3 px-2 ${
                pause ? "pause-animation" : ""
              } scroll-now`}
              style={{
                animationDuration: `${scrollHeight / 60}s`,
              }}
            >
              {scrollingList.map((officer, i) => (
                officer.blank ? (
                  <div key={i} className="h-10"></div> // blank space for smooth looping
                ) : (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 shadow-sm hover:shadow-md hover:bg-white transition relative"
                  >
                    <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>

                    <img
                      onClick={() => openPreviewModel(officer?.imgPath)}
                      src={officer?.imgPath || defaultAvatar}
                      alt={officer?.officerName}
                      className="w-20 h-20 rounded-full object-cover shadow cursor-pointer hover:scale-105 transition"
                    />

                    <div className="flex flex-col flex-1">
                      <h2 className="font-bold text-lg flex items-center gap-2 text-gray-800">
                        <FaUserTie className="text-blue-600" />
                        {officer?.officerName}
                      </h2>

                      <p className="text-gray-600 text-sm mb-2">
                        {officer?.designation}
                      </p>

                      <div className="flex flex-col gap-1 text-sm">
                        <p className="flex items-center gap-2 text-gray-700">
                          <FaPhoneAlt className="text-green-600" />
                          {officer?.contactNo}
                        </p>
                        <p className="flex items-center gap-2 text-gray-700">
                          <FaEnvelope className="text-red-600" />
                          {officer?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </>
        )}

        <style>{`
          @keyframes scrollLoop {
            0% { transform: translateY(10); }
            100% { transform: translateY(-55%); }
          }

          .scroll-now {
            animation-name: scrollLoop;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }

          .pause-animation {
            animation-play-state: paused !important;
          }
        `}</style>
        {isModalPreviewOpen && (
          <ImagePreview imageSrc={previewImg} closePreview={closePreviewModel} />
        )}
      </div>

  );
};

export default OfficerList;
