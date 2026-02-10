import React from "react";

const Footer = () => {
    return (
        <footer className="w-full mt-auto">
            {/* Decorative top border */}
            <div className="h-1 bg-gradient-to-r from-amber-300 via-[#7c5327] to-amber-300"></div>

            <div className="bg-white/80 backdrop-blur-sm py-5">
                <div className="max-w-[95%] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-600">
                    {/* Left: Brand + tagline */}
                    <div className="flex-1 flex items-center gap-2">
                        <img src="/static/logo.png" alt="OrderIQ" className="w-7 h-7" />
                        <span className="font-bold text-[#7c5327] text-base">OrderIQ</span>
                        <span className="text-gray-300 hidden md:inline">—</span>
                        <span className="text-[#7c5327]/70 hidden md:inline text-xs font-bold">Powered by AI</span>
                    </div>

                    {/* Center: Nav pills */}
                    <nav className="flex items-center justify-center gap-1.5">
                        {["About", "Contact"].map((label) => (
                            <a
                                key={label}
                                href={`/${label.toLowerCase()}`}
                                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#7c5327]/70 hover:bg-[#7c5327] hover:text-white transition-all duration-200"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>

                    {/* Right: Copyright */}
                    <div className="flex-1 flex justify-end">
                        <span className="text-[#7c5327]/70 text-xs font-bold">
                            © {new Date().getFullYear()} OrderIQ Inc.
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
