import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const AGENTS = ["Lisa", "Dr. Maxwell", "Zara"];

const App = () => {
  const [message, setMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [connected, setConnected] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const inputRef = useRef(null);
  const chatRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL);

    socketRef.current.on("connect", () => {
      console.log("✅ Connected:", socketRef.current.id);
      setConnected(true);
    });

    socketRef.current.on("agentReply", ({ reply, suggestions, agentName }) => {
      setHistory((prev) => [...prev, { role: "agent", content: `${agentName}: ${reply}`, agentName }]);
      setSuggestions(suggestions);
      setLoading(false);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;
    if (!socketRef.current?.connected) return;

    setHistory([...history, { role: "user", content: message }]);
    setMessage("");
    setLoading(true);
    setSuggestions([]);

    socketRef.current.emit("userMessage", { message, agent: selectedAgent });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAvatar = (role, agentName = "") => {
    if (role === "user") {
      return "🧑";
    }
    if (agentName === "Dr. Maxwell") return "🧠";
    if (agentName === "Zara") return "🤖";
    return "👩‍💼";
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">AI Messaging Panel</h2>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Select Agent:</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              {AGENTS.map((agent) => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>

          <div className="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600 space-y-2">
            <AnimatePresence initial={false}>
              {history.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-2 max-w-[80%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                >
                  <div className="text-2xl">{getAvatar(msg.role, msg.agentName)}</div>
                  <div
                    className={`p-2 rounded-lg ${msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white"
                      }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && <div className="italic text-gray-500 dark:text-gray-400 text-sm">{selectedAgent} is typing...</div>}
            <div ref={chatRef}></div>
          </div>

          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!connected || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500 text-sm transition"
                  onClick={() => setMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;