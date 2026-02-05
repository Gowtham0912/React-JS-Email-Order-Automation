import React, { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ user, handleLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="bg-white text-white px-4 py-3 flex items-center mx-5 mt-5 rounded-2xl relative">
      {/* LEFT : Logo */}
      <div className="flex items-center space-x-3">
        <img src="/static/logo.png" alt="Logo" className="w-12 object-contain" />
        <h1 className="m-0 text-black font-bold text-2xl">OrderIQ</h1>
      </div>

      {/* CENTER : Navigation */}
      <div className="absolute left-1/2 transform -translate-x-1/2">
        <nav className="flex space-x-8">
          <Link to="/dashboard" className="text-[#7c5327] font-semibold text-lg hover:text-black transition">
            Dashboard
          </Link>
          <Link to="/analytics" className="text-[#7c5327] font-semibold text-lg hover:text-black transition">
            Analytics
          </Link>
          <Link to="/contact" className="text-[#7c5327] font-semibold text-lg hover:text-black transition">
            Contact
          </Link>
          <Link to="/about" className="text-[#7c5327] font-semibold text-lg hover:text-black transition">
            About
          </Link>
        </nav>
      </div>

      {/* RIGHT : User */}
      <div className="relative inline-block ml-auto">
        <div
          id="userIcon"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-10 h-10 rounded-full bg-white text-[#eaa73e] font-bold text-xl flex items-center justify-center cursor-pointer lg:bg-[#795227] hover:bg-black md:bg-[#795227] sm:bg-[#795227] transition"
        >
          {user ? user[0].toUpperCase() : "U"}
        </div>

        {dropdownOpen && (
          <div
            id="userDropdown"
            className="absolute right-0 mt-5 bg-white text-gray-800 min-w-[180px] rounded-lg shadow-lg z-50"
          >
            <p className="px-4 py-2 border-b border-gray-200 text-sm text-gray-600 rounded-lg">
              {user || "User"}
            </p>

            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition flex items-center justify-center rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15"
                />
              </svg>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
