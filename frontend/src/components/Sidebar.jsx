import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-[#7c5327] to-[#a8722a]">
                    <div className="flex items-center gap-3">
                        <img src="/static/logo.png" alt="Logo" className="w-9 object-contain" />
                        <h2 className="text-white font-bold text-xl">OrderIQ</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="mt-2 px-3">
                    <Link
                        to="/dashboard"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/dashboard")
                            ? "bg-amber-100 text-[#7c5327]"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                        Dashboard
                    </Link>

                    <Link
                        to="/orders"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/orders")
                            ? "bg-amber-100 text-[#7c5327]"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                        </svg>
                        Orders
                    </Link>

                    <Link
                        to="/analytics"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/analytics")
                            ? "bg-amber-100 text-[#7c5327]"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                        </svg>
                        Analytics
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-3"></div>

                    {/* Trash */}
                    <Link
                        to="/trash"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/trash")
                            ? "bg-red-50 text-red-700"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Trash
                        <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">30d</span>
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-3"></div>

                    <Link
                        to="/contact"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/contact")
                            ? "bg-amber-100 text-[#7c5327]"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        Contact
                    </Link>

                    <Link
                        to="/about"
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 font-medium transition-all ${isActive("/about")
                            ? "bg-amber-100 text-[#7c5327]"
                            : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                        </svg>
                        About
                    </Link>
                </nav>
            </div>
        </>
    );
};

export default Sidebar;
