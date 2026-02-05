import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setLoginUser }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
                credentials: "include",
            });

            const data = await response.json();

            if (data.success) {
                setLoginUser(email);
                navigate("/dashboard");
            } else {
                setError(data.error || "Login failed");
            }
        } catch (err) {
            setError("Failed to connect to server");
        }
    };

    return (
        <div className="h-screen m-0 flex justify-center items-center bg-gradient-to-br from-[#fdca5e] to-[#a88436] font-sans">
            {/* Popup Info Modal */}
            {isModalOpen && (
                <div
                    id="infoModal"
                    className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
                    onClick={(e) => e.target.id === "infoModal" && setIsModalOpen(false)}
                >
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-left relative flex flex-col">
                        <h2 className="text-xl font-semibold mb-2 text-[#7c5327]">What is a Google App Password?</h2>
                        <p className="text-sm text-gray-700 mb-3">
                            A <b>Google App Password</b> is a 16-character passcode that allows apps or devices to access your Google account securely. It’s required when using Gmail in external apps (like OrderIQ) if 2-Step Verification is enabled.
                        </p>
                        <h3 className="font-medium mb-1 text-[#7c5327]">How to Create One:</h3>
                        <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                            <li>
                                Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Account → Security</a>.
                            </li>
                            <li>Enable <b>2-Step Verification</b>.</li>
                            <li>After enabling, go to Security → <b>App Passwords</b>.</li>
                            <li>Select “Mail” as the app and “Other (Custom name)” like “OrderIQ”.</li>
                            <li>Generate the password and copy the 16-character code.</li>
                        </ol>

                        {/* Close button at bottom-right */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="bg-[#7c5327] text-white px-4 py-2 rounded hover:bg-black transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Card */}
            <div className="relative bg-white p-8 rounded-xl shadow-2xl w-[350px] text-center fade-in">
                {/* Info Button */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="absolute top-3 right-3 bg-white p-1.5 rounded-full hover:bg-gray-100 transition"
                    title="What is App Password?"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
                        />
                    </svg>
                </button>

                {/* Content */}
                <img src="/static/logo.png" className="w-12 mx-auto mt-10" alt="Logo" />
                <h1 className="font-bold text-2xl text-black">Welcome to OrderIQ</h1>
                <h2 className="mb-5 mt-2.5 text-[15px] text-gray-800">ERP Login</h2>

                <form onSubmit={handleLogin} className="space-y-4 mb-10">
                    <input
                        type="text"
                        name="email"
                        placeholder="Enter Gmail address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-[90%] px-3 py-2 border border-gray-300 rounded-lg text-[15px] text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7c5327]"
                    />

                    {/* Password field with toggle */}
                    <div className="relative w-[90%] mx-auto">
                        <input
                            type={visible ? "text" : "password"}
                            name="password"
                            placeholder="Enter App Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[15px] text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7c5327]"
                        />
                        <button
                            type="button"
                            onClick={() => setVisible(!visible)}
                            className="absolute right-3 top-2.5 text-gray-500 transition-colors duration-300"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className={`w-5 h-5 ${visible ? "text-[#7c5327]" : "text-gray-500"}`}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.312 4.5 12 4.5c4.688 0 8.577 3.01 9.964 7.178a1.012 1.012 0 010 .644C20.577 16.49 16.688 19.5 12 19.5c-4.688 0-8.577-3.01-9.964-7.178z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="bg-[#7c5327] hover:bg-black text-white px-3 w-[90%] py-2 rounded-lg text-[16px] transition duration-300"
                    >
                        Login
                    </button>
                </form>

                {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .fade-in { animation: fadeIn 0.5s ease; }
      `}</style>
        </div>
    );
};

export default Login;
