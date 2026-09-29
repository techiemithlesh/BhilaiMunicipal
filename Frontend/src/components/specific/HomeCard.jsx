import { Link } from "react-router-dom";

const HomeCard = ({ title, icon: Icon, links = [] }) => {
  return (
    <div className="flex flex-col h-full">
      <h3 className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-700 uppercase mb-3 pb-2 border-b-2 border-gray-800">
        {Icon && <Icon className="text-gray-900" />}
        {title}
      </h3>

      <div className="flex flex-col flex-1 bg-gray-900 shadow-md rounded-lg divide-y divide-gray-700 overflow-hidden">
        {links.map((item, index) =>
          item.disabled ? (
            <div
              key={index}
              className="flex justify-between items-center px-4 py-3 text-white/60 text-sm md:text-base cursor-not-allowed select-none"
              title="Coming soon"
            >
              <span>{item.label}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide">
                Coming soon
              </span>
            </div>
          ) : item.to.startsWith("#") ? (
            <a
              key={index}
              href={item.to}
              className="block hover:bg-gray-700 px-4 py-3 text-white text-sm md:text-base transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={index}
              to={item.to}
              className="block hover:bg-gray-700 px-4 py-3 text-white text-sm md:text-base transition-colors"
            >
              {item.label}
            </Link>
          )
        )}
      </div>
    </div>
  );
};

export default HomeCard;
