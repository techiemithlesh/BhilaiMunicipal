import { Link, useLocation } from "react-router-dom";

const BreadCrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="bg-2 px-5 py-3 rounded-xl w-full text-white">
      <ol className="flex list-reset">
        <li>
          <Link to="/" className="hover:text-yellow-700">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;
          const isLast = index === pathnames.length - 1;
          return isLast ? (
            <li key={to} className="mx-2">
              / {value}
            </li>
          ) : (
            <li key={to}>
              <Link to={to} className="mx-1 hover:text-yellow-700">
                / {value}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BreadCrumb;
