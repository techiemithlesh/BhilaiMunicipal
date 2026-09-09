import { format } from "date-fns";

const AdminFooter = () => {
  const currentDate = format(new Date(), "yyyy");

  return (
    <div className="bg-sub-header shadow-md py-2  text-center text-xs">
      &copy; {currentDate} ALL Right Reserved UINFO PVT LTD
    </div>
  );
};

export default AdminFooter;
