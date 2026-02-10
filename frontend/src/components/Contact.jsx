import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Contact = ({ user, handleLogout }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="bg-[#fdca5e] font-sans h-screen overflow-hidden">
            <div className="h-full overflow-y-auto no-scrollbar">
                <Navbar user={user} handleLogout={handleLogout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="max-w-2xl mx-auto mt-10">
                    <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                        <h2 className="text-3xl font-bold text-[#7c5327] mb-6">Contact Support</h2>
                        <p className="text-gray-700 mb-8">
                            Having issues with the OrderIQ platform? Reach out to our support team.
                        </p>

                        <div className="space-y-4 text-left">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="bg-[#7c5327] p-2 rounded-full text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Email Us</h4>
                                    <p className="text-gray-600">support@orderiq.com</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="bg-[#7c5327] p-2 rounded-full text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Call Us</h4>
                                    <p className="text-gray-600">+1 (800) 123-4567</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default Contact;
