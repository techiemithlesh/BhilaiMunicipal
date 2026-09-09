function MobileFooter({ ulbData }) {
  return (
    <footer className="bg-gray-800 py-2 w-full text-white text-sm text-center">
      © {new Date().getFullYear()} {ulbData?.ulbName || "Loading..."} App. All
      rights reserved.
    </footer>
  );
}

export default MobileFooter;
