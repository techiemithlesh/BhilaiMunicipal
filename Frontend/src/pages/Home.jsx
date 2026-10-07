import HomeCard from "../components/specific/HomeCard";
import Layout from "../layout/Layout";
import { FaBuilding, FaTint, FaTrashAlt } from "react-icons/fa";
import HomeSlider from "../components/specific/HomeSlider";
import NoticeList from "../components/specific/NoticeList";
import OfficerList from "../components/specific/OfficerList";
import AboutUlb from "../components/specific/AboutUlb";

const Home = () => {
  const cardData = [
    {
      title: "Property",
      icon: FaBuilding,
      links: [
        { label: "Search Property/Holding", to: "/citizen/holding/search" },
        { label: "View Property Details", to: "/citizen/holding/search" },
        { label: "View Property Demand Details", to: "/citizen/holding/search" },
        { label: "View Last Payment Details", to: "/citizen/holding/search" },
        { label: "Pay Property/Holding Tax", to: "/citizen/holding/search" },
        { label: "Property Tax Calculator", to: "/tax-calculator" },
        { label: "Know Your Tax Collector", to: "#officers" },
      ],
    },
    {
      title: "Water",
      icon: FaTint,
      links: [
        { label: "Search Consumer Details", to: "/citizen/water/search" },
        { label: "View Consumer Details", to: "/citizen/water/search" },
        { label: "View Consumer Demand Details", to: "/citizen/water/search" },
        { label: "View Last Payment Details", to: "/citizen/water/search" },
        { label: "Pay Water User Charge", to: "/citizen/water/search" },
        { label: "Apply New Connection", to: "/citizen/water/apply-connection" },
        { label: "Know Your Tax Collector", to: "#officers" },
      ],
    },
    {
      title: "Solid Waste User Charge",
      icon: FaTrashAlt,
      links: [
        { label: "Search Consumer Details", disabled: true },
        { label: "View Consumer Details", disabled: true },
        { label: "View Consumer Demand Details", disabled: true },
        { label: "View Last Payment Details", disabled: true },
        { label: "Pay Solid Waste User Charge", disabled: true },
        { label: "Know Your Tax Collector", to: "#officers" },
      ],
    },
  ];

  return (
    <Layout
      title="MUNICIPAL CORPORATION BHILAI - Home"
      description="Pay Property Tax, Water Tax, Solid Waste Charges, and more online. Access municipal services conveniently from your home."
    >
      <HomeSlider />
      <AboutUlb />
      {/* CARD CONTAINER */}
      <div className="py-10 px-4 md:px-8 bg-[#f8f9fa]">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
          Municipal Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardData.map((card, index) => (
            <HomeCard key={index} {...card} />
          ))}
        </div>
      </div>
      <div id="officers" className="py-4 px-4 md:px-8 bg-[#f8f9fa] scroll-mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <OfficerList />
          <NoticeList />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
