import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Loader2,
  Plus,
  Send,
  User,
  Bot,
} from "lucide-react";

import { listNotebooks } from "../services/notebookService";
import { askQuestion } from "../services/questionService";

import type { Notebook } from "../types/notebook";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [selectedNotebookId, setSelectedNotebookId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [loadingNotebooks, setLoadingNotebooks] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadNotebooks();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, asking]);

  const loadNotebooks = async () => {
    try {
      setLoadingNotebooks(true);
      setError("");

      const response = await listNotebooks();
      const notebookList = response.notebooks || [];

      setNotebooks(notebookList);

      if (notebookList.length > 0) {
        setSelectedNotebookId(notebookList[0].notebook_id);
      }
    } catch {
      setError("Unable to load your notebooks.");
    } finally {
      setLoadingNotebooks(false);
    }
  };

  const selectedNotebook = notebooks.find(
    (notebook) => notebook.notebook_id === selectedNotebookId,
  );

  const handleAsk = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !selectedNotebookId || asking) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setAsking(true);
    setError("");

    // Reset textarea height.
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await askQuestion({
        notebook_id: selectedNotebookId,
        question: trimmedQuestion,
      });

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          response.answer || "I could not find an answer in this notebook.",
      };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch {
      setError("I could not get an answer. Please try again.");
    } finally {
      setAsking(false);

      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleAsk();
    }
  };

  const handleQuestionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setQuestion(event.target.value);

    const textarea = event.target;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 192)}px`;
  };

  const handleNotebookChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setSelectedNotebookId(event.target.value);
    setMessages([]);
    setQuestion("");
    setError("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const startNewChat = () => {
    setMessages([]);
    setQuestion("");
    setError("");

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  return (
    <div className="flex min-h-full flex-col bg-[#212121] text-white">
      {/* Notebook selector */}
      <div className="flex shrink-0 justify-center px-4 pt-4">
        <div className="relative w-full max-w-xs">
          <BookOpen
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/40"
          />

          <select
            value={selectedNotebookId}
            onChange={handleNotebookChange}
            disabled={loadingNotebooks || notebooks.length === 0}
            className="w-full appearance-none rounded-lg border border-white/10 bg-[#2a2a2a] py-2.5 pl-10 pr-9 text-sm text-white outline-none transition hover:border-white/15 focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {notebooks.length === 0 ? (
              <option value="">
                {loadingNotebooks
                  ? "Loading notebooks..."
                  : "No notebooks available"}
              </option>
            ) : (
              notebooks.map((notebook) => (
                <option key={notebook.notebook_id} value={notebook.notebook_id}>
                  {notebook.name}
                </option>
              ))
            )}
          </select>

          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40"
          />
        </div>
      </div>

      {/* Conversation */}
      {messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8">
            <div className="space-y-8">
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.role === "user" ? "bg-white/10" : "bg-white"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={16} className="text-white/70" />
                    ) : (
                      <Bot size={16} className="text-black" />
                    )}
                  </div>

                  {/* Message */}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="mb-1.5 text-xs font-medium text-white/40">
                      {message.role === "user" ? "You" : "ProfessorMind"}
                    </div>

                    <div className="whitespace-pre-wrap text-sm leading-7 text-white/90">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Thinking */}
              {asking && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white">
                    <Bot size={16} className="text-black" />
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-sm text-white/40">
                    <Loader2 size={15} className="animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Bot size={27} className="text-white/70" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {selectedNotebook
                ? `Ask about ${selectedNotebook.name}`
                : "Ask ProfessorMind"}
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
              Ask questions about the lecture material in your selected
              notebook.
            </p>

            {!loadingNotebooks && notebooks.length === 0 && (
              <p className="mt-5 text-xs text-white/30">
                Create a notebook and upload your study material to get started.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto w-full max-w-3xl px-4 pb-3">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 px-4 pb-5 pt-2">
        <div className="mx-auto w-full max-w-3xl">
          <div className="relative rounded-2xl border border-white/10 bg-[#2f2f2f] shadow-lg">
            <textarea
              ref={textareaRef}
              value={question}
              onChange={handleQuestionChange}
              onKeyDown={handleKeyDown}
              disabled={asking || loadingNotebooks || !selectedNotebookId}
              rows={1}
              placeholder={
                selectedNotebookId
                  ? "Ask a question..."
                  : "Create a notebook first"
              }
              className="max-h-48 min-h-[56px] w-full resize-none overflow-y-auto bg-transparent px-4 py-4 pr-14 text-sm leading-6 text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={() => void handleAsk()}
              disabled={!question.trim() || !selectedNotebookId || asking}
              className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
              aria-label="Send question"
            >
              {asking ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Send size={17} />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-[11px] text-white/20">
              Enter to send · Shift + Enter for a new line
            </p>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={startNewChat}
                className="inline-flex items-center gap-1.5 text-[11px] text-white/30 transition hover:text-white/60"
              >
                <Plus size={12} />
                New chat
              </button>
            )}
          </div>

          <p className="mt-1 text-center text-[10px] text-white/15">
            Answers are generated from material in the selected notebook.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
