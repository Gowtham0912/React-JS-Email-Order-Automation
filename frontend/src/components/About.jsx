import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const About = ({ user, handleLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="bg-[#fdca5e] font-sans min-h-screen flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="max-w-xl mx-auto mt-8">
                    <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                        <img src="/static/logo.png" alt="OrderIQ Logo" className="w-14 mx-auto mb-3" />
                        <h2 className="text-2xl font-bold text-[#7c5327] mb-3">About OrderIQ</h2>
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            OrderIQ is an advanced AI-powered automation tool designed to streamline order processing from email to ERP.
                            By leveraging Natural Language Processing (NLP), we extract critical order details from unstructured emails
                            and seamlessly integrate them into your business workflow.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] text-sm mb-1">AI Extraction</h3>
                                <p className="text-xs text-gray-600">Automatically identifies products, quantities, and dates from email text.</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] text-sm mb-1">Seamless ERP</h3>
                                <p className="text-xs text-gray-600">Integrates directly with your database to keep inventory up to date.</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] text-sm mb-1">Smart Analytics</h3>
                                <p className="text-xs text-gray-600">Provides actionable insights into order trends and processing efficiency.</p>
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-gray-500">
                            Version 1.0.0 | © 2026 OrderIQ Inc.
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default About;
