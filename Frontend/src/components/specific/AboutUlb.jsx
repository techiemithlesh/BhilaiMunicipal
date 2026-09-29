import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaGlobe,
  FaBuilding,
  FaTint,
  FaTrashAlt,
  FaFileContract,
} from "react-icons/fa";
import { useUlb } from "../../contexts/UlbContext";

const services = [
  {
    icon: FaBuilding,
    title: "Property Tax",
    description: "Search your holding, view demand and payment history, and pay property tax online.",
  },
  {
    icon: FaTint,
    title: "Water User Charges",
    description: "View your water consumer details, check dues, and pay water charges from home.",
  },
  {
    icon: FaFileContract,
    title: "Trade License",
    description: "Apply for, renew, or search trade license records online.",
  },
  {
    icon: FaTrashAlt,
    title: "Solid Waste Management",
    description: "Track solid waste user charges and services as they become available online.",
  },
];

const AboutUlb = () => {
  const ulb = useUlb();

  if (!ulb) return null;

  const location = [ulb?.city, ulb?.district, ulb?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-[#f8f9fa] py-10 px-4 md:px-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mx-auto max-w-5xl">
        {ulb?.logoImg && (
          <img
            src={ulb.logoImg}
            alt={ulb?.ulbName}
            className="w-24 h-24 object-contain shrink-0"
          />
        )}

        <div className="text-center md:text-left">
          <h2 className="mb-3 font-bold text-2xl md:text-3xl">
            About {ulb?.ulbName}
          </h2>

          <p className="text-gray-600 leading-relaxed">
            {ulb?.ulbName} is the Urban Local Body responsible for civic
            administration and public services in the area, including
            property assessment and tax collection, water supply and user
            charges, trade licensing, and solid waste management. This portal
            was launched to bring those services online, so citizens can
            search, view, and pay their dues without visiting a municipal
            office in person.
          </p>

          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4 text-gray-600 text-sm">
            {location && (
              <span className="flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-gray-900" />
                {location}
              </span>
            )}
            {ulb?.tollFreeNo && (
              <span className="flex items-center gap-1.5">
                <FaPhoneAlt className="text-gray-900" />
                {ulb.tollFreeNo}
              </span>
            )}
            {ulb?.ulbUrl && (
              <a
                href={ulb.ulbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-900"
              >
                <FaGlobe className="text-gray-900" />
                {ulb.ulbUrl}
              </a>
            )}
          </div>
        </div>
      </div>

     
    </div>
  );
};

export default AboutUlb;
