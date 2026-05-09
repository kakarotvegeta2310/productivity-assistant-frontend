"use client";
import { useState, useRef, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

type ApiHistory = {
  role: string;
  content: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ApiHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  function getTime() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  async function sendMessage() {
    if (!message.trim() || loading) return;

    const userMsg: Message = { role: "user", content: message, timestamp: getTime() };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setLoading(true);
    setActions([]);

    try {
      const res = await fetch("https://web-production-1432a.up.railway.app/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, user_id: user?.id }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.reply || "...",
        timestamp: getTime(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setHistory(data.history || []);
      setActions(Array.isArray(data.actions) ? data.actions : []);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error connecting to assistant.", timestamp: getTime() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function toggleTask(index: number) {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function clearChat() {
    setMessages([]);
    setHistory([]);
    setActions([]);
    setCompletedTasks(new Set());
  }

  const suggestions = [
    "Plan my day 9am to 6pm",
    "Save a note: review project",
    "What time is it?",
    "Show my notes",
  ];

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden bg-gray-900 border-r border-gray-800 flex flex-col`}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <span className="font-bold">ProductivityAI</span>
          </div>
        </div>

        <div className="p-4 flex-1">
          <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Quick Actions</p>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => { setMessage(s); setSidebarOpen(false); }}
              className="w-full text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-lg mb-1 transition"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={clearChat}
            className="w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 px-3 py-2 rounded-lg transition"
          >
            🗑 Clear Chat
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div>
                <p className="font-semibold text-sm">Productivity Assistant</p>
                <p className="text-xs text-green-400">● Online</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              {user?.firstName || user?.emailAddresses[0]?.emailAddress}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
              <div className="text-6xl">🤖</div>
              <div>
                <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
                <p className="text-gray-400 text-sm">Ask me to plan your day, save notes, or manage tasks.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(s)}
                    className="text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-blue-500 text-gray-300 px-4 py-3 rounded-xl text-left transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-100 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-xs text-gray-500">{msg.timestamp}</span>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">
                  {user?.firstName?.[0] || "U"}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm flex-shrink-0">
                🤖
              </div>
              <div className="bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Task list */}
          {actions.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 max-w-[75%] w-full">
                <p className="font-semibold text-green-400 mb-3 text-sm flex items-center gap-2">
                  📋 Suggested Tasks
                  <span className="text-xs text-gray-500">({actions.filter((_, i) => !completedTasks.has(i)).length} remaining)</span>
                </p>
                <ul className="space-y-2">
                  {actions.map((task, i) => (
                    <li
                      key={i}
                      onClick={() => toggleTask(i)}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                        completedTasks.has(i)
                          ? "bg-green-500 border-green-500"
                          : "border-gray-500 group-hover:border-green-400"
                      }`}>
                        {completedTasks.has(i) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className={`text-sm transition ${completedTasks.has(i) ? "line-through text-gray-500" : "text-gray-200"}`}>
                        {task}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-900/50 backdrop-blur">
          <div className="max-w-3xl mx-auto flex gap-3 items-end">
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message your assistant... (Enter to send)"
                rows={1}
                style={{ maxHeight: "120px" }}
                className="w-full bg-transparent text-sm resize-none focus:outline-none text-white placeholder-gray-500"
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed w-11 h-11 rounded-xl flex items-center justify-center transition flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-600 text-center mt-2">Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}