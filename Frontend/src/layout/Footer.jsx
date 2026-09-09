import { FaGooglePlay } from "react-icons/fa";

const Footer = ({ ulbData }) => {
  return (
    <footer className="bg-1 shadow-inner border-t border-border-color-light w-full text-main">
      <div className="flex flex-col gap-4 mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top Links Section */}
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-3 text-sm">
          <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2">
            {[
              { label: "Sitemap", link: "#" },
              { label: "FAQ", link: "#" },
              { label: "Website Policy and Disclaimer", link: "#" },
              { label: "Gallery", link: "#" },
              { label: "Holiday List", link: "#" },
            ].map(({ label, link }, idx) => (
              <a
                key={idx}
                href={link}
                className="text-secondary hover:text-accent hover:underline transition"
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {/* <div className="flex md:flex-row flex-col justify-between items-center gap-6">
          <p className="font-semibold text-lg md:text-left text-center">
            📲 Download Our Mobile App for Quick Access to Services
          </p>
          <a
            href="#"
            className="flex items-center gap-3 bg-accent hover:bg-yellow-400 shadow-md px-6 py-3 rounded-full font-semibold text-black transition"
          >
            <FaGooglePlay className="text-2xl" />
            <span>Get it on Google Play</span>
          </a>
        </div> */}

        <hr className="border-t border-border-color-light" />

        {/* Footer Bottom */}
        <div className="flex md:flex-row flex-col justify-between items-center gap-2 text-secondary text-sm md:text-left text-center">
          <p>
            &copy; {new Date().getFullYear()} Government of {ulbData?.state},{" "}
            <span className="uppercase">India.</span> All Rights Reserved.
          </p>
          <p>
            In collaboration with{" "}
            <span className="font-medium text-accent">
             <a href="https://www.uinfotechnology.com" target="_blank"> {ulbData?.collaboration}</a>
            </span>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
