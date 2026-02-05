import React from "react";
import Navbar from "./Navbar";

const About = ({ user, handleLogout }) => {
    return (
        <div className="bg-[#fdca5e] font-sans h-screen overflow-hidden">
            <div className="h-full overflow-y-auto no-scrollbar">
                <Navbar user={user} handleLogout={handleLogout} />

                <div className="max-w-3xl mx-auto mt-10">
                    <div className="bg-white rounded-xl p-8 shadow-lg text-center">
                        <img src="/static/logo.png" alt="OrderIQ Logo" className="w-20 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-[#7c5327] mb-4">About OrderIQ</h2>
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                            OrderIQ is an advanced AI-powered automation tool designed to streamline order processing from email to ERP.
                            By leveraging Natural Language Processing (NLP), we extract critical order details from unstructured emails
                            and seamlessly integrate them into your business workflow.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] mb-2">AI Extraction</h3>
                                <p className="text-sm text-gray-600">Automatically identifies products, quantities, and dates from email text.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] mb-2">Seamless ERP</h3>
                                <p className="text-sm text-gray-600">Integrates directly with your database to keep inventory up to date.</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-bold text-[#7c5327] mb-2">Smart Analytics</h3>
                                <p className="text-sm text-gray-600">Provides actionable insights into order trends and processing efficiency.</p>
                            </div>
                        </div>

                        <div className="mt-10 text-sm text-gray-500">
                            Version 1.0.0 | © 2026 OrderIQ Inc.
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

export default About;
