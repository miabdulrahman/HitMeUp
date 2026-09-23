import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaLinkedin
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-white">

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

        {/* Brand */}
        <div>
          <a
            href="#home"
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF4A2F] font-black text-white">
              H
            </div>

            <span className="text-2xl font-black text-[#141922]">
              Hit<span className="text-[#FF4A2F]">Me</span>Up
            </span>
          </a>

          <p className="mt-4 max-w-xs leading-6 text-gray-500">
            Local Deals. Big Savings.
          </p>
        </div>

        {/* Links */}
        <div>
          <h3 className="font-black text-[#141922]">
            Explore
          </h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
            <a href="#deals" className="hover:text-[#FF4A2F]">
              Deals
            </a>

            <a href="#categories" className="hover:text-[#FF4A2F]">
              Categories
            </a>

            <a href="#how-it-works" className="hover:text-[#FF4A2F]">
              How It Works
            </a>
          </div>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-black text-[#141922]">
            Company
          </h3>

          <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
            <a href="#about" className="hover:text-[#FF4A2F]">
              About
            </a>

            <a href="#contact" className="hover:text-[#FF4A2F]">
              Contact
            </a>

            <a href="#privacy" className="hover:text-[#FF4A2F]">
              Privacy Policy
            </a>
          </div>
        </div>

        {/* Social */}
        <div>
          <h3 className="font-black text-[#141922]">
            Follow Us
          </h3>

          <div className="mt-4 flex gap-3">

            <a
              href="#facebook"
              className="rounded-xl bg-gray-100 p-3 text-[#141922] hover:bg-[#FF4A2F] hover:text-white"
            >
              <FaFacebook size={18} />
            </a>

            <a
              href="#instagram"
              className="rounded-xl bg-gray-100 p-3 text-[#141922] hover:bg-[#FF4A2F] hover:text-white"
            >
              <FaInstagram size={18} />
            </a>

            <a
              href="#twitter"
              className="rounded-xl bg-gray-100 p-3 text-[#141922] hover:bg-[#FF4A2F] hover:text-white"
            >
              <FaTwitter size={18} />
            </a>

            <a
              href="#linkedin"
              className="rounded-xl bg-gray-100 p-3 text-[#141922] hover:bg-[#FF4A2F] hover:text-white"
            >
              <FaLinkedin size={18} />
            </a>

          </div>
        </div>

      </div>

      <div className="border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-5 py-5 text-center text-sm text-gray-500 lg:px-8">
          © 2026 HitMeUp. All rights reserved.
        </div>
      </div>

    </footer>
  );
}

export default Footer;