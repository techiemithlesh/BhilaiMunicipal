import { useEffect, useState } from "react";
import MobileLayout from "../layout/MobileLayout";
import MenuCardTree from "../components/common/MenuCardTree";
import { getUserDetails } from "../utils/auth";

function MobileDashboard() {
  const [menuTree, setMenuTree] = useState([]);
  const [isFrozen, setIsFrozen] = useState(true); // UI locked until ulbData is ready

  useEffect(() => {
    const userDtl = getUserDetails();
    if (userDtl?.menuTree) {
      setMenuTree(userDtl.menuTree);
    }
  }, []);

  return (
    <MobileLayout onUlbReady={() => setIsFrozen(false)}>
      <div
        className={`${isFrozen ? "pointer-events-none filter blur-sm" : ""}`}
      >
        <div className="flex flex-col gap-6 px-4 py-4">
          {menuTree.length > 0 ? (
            <MenuCardTree menuItems={menuTree} />
          ) : (
            <p className="text-gray-500 text-center">
              No menu assigned to this user.
            </p>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

export default MobileDashboard;
