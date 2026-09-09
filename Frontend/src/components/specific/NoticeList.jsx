import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { publicNoticeApi } from "../../api/endpoints";

const ulbId = import.meta.env.VITE_REACT_APP_ULB_ID;

const NoticeList = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pause, setPause] = useState(false);

  const listRef = useRef(null);
  const [scrollHeight, setScrollHeight] = useState(0);

  // FETCH NOTICES
  useEffect(() => {
    const fetchNotices = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(publicNoticeApi, {
          ulbId,
          currentFy: true,
          all: true,
        });

        if (response?.data?.status) {
          setNotices(response.data.data);
        }
      } catch (error) {
        console.log("error", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // CALCULATE SCROLL HEIGHT
  useEffect(() => {
    if (listRef.current) {
      setScrollHeight(listRef.current.scrollHeight);
    }
  }, [notices]);

  // Duplicate list + blank item (same as OfficerList)
  const scrollingList = [...notices, { blank: true }, ...notices];

  return (
      <div
        className="h-[300px] overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg relative"
        onMouseEnter={() => setPause(true)}
        onMouseLeave={() => setPause(false)}
      >
        <>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-700">Loading...</span>
            </div>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-center border-b py-2 bg-white z-20 relative h-[50px]">
                Public Notices
              </h2>

              {/* SCROLLING AREA */}
              <div
                ref={listRef}
                className={`absolute top-[55px] left-0 w-full flex flex-col gap-3 px-2 ${
                  pause ? "pause-animation" : ""
                } scroll-now`}
                style={{
                  animationDuration: `${scrollHeight / 60}s`,
                }}
              >
                {scrollingList.map((notice, i) =>
                  notice.blank ? (
                    <div key={i} className="h-10"></div> // Spacer (same as OfficerList)
                  ) : (
                    <div
                      key={i}
                      onClick={() => window.open(notice.docPath, "_blank")}
                      className="px-4 py-3 shadow-md border-b border-dotted rounded-md cursor-pointer bg-gray-50 hover:bg-white transition"
                    >
                      <div className="text-sm font-semibold text-red-500 opacity-90">
                        {notice.noticeDate}
                      </div>
                      <div className="text-sm font-semibold leading-snug mt-1">
                        {notice.subject}
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* ANIMATION CSS */}
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
        </>
      </div>
  );
};

export default NoticeList;
