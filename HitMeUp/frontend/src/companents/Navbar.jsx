import { Search, MapPin } from "lucide-react";


export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: "#FF4A2F" }}
          >
            <MapPin size={22} fill="white" />
          </div>

          <span className="text-xl font-extrabold">
            Hit<span style={{ color: "#FF4A2F" }}>MeUp</span>
          </span>
        </a>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 lg:flex">
          <a href="#" className="font-semibold text-[#FF4A2F]">
            Home
          </a>

          <a href="#deals" className="text-gray-600 hover:text-[#FF4A2F]">
            Deals
          </a>

          <a href="#categories" className="text-gray-600 hover:text-[#FF4A2F]">
            Categories
          </a>

          <a href="#how-it-works" className="text-gray-600 hover:text-[#FF4A2F]">
            How It Works
          </a>

          <a href="#about" className="text-gray-600 hover:text-[#FF4A2F]">
            About
          </a>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">

          <div className="hidden items-center rounded-full border px-4 py-2 xl:flex">
            <Search size={18} className="text-gray-400" />

            <input
              className="ml-2 w-48 border-none outline-none"
              placeholder="Search deals..."
            />
          </div>

          <button className="hidden rounded-full px-5 py-2 font-semibold sm:block">
            Login
          </button>

          <button
            className="rounded-full px-5 py-2.5 font-semibold text-white"
            style={{ backgroundColor: "#FF4A2F" }}
          >
            Sign Up
          </button>

        </div>
      </div>
    </header>
  );
}