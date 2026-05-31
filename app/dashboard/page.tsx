"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NavBar from "../components/NavBar";
import StatCard from "../components/StatCard";
import { loadData, saveData } from "../lib/store";
import type {
  FayData,
  TikTokAccount,
  Task,
  Transaction,
  Note,
  ContentIdea,
} from "../lib/types";

type Tab = "tiktok" | "tasks" | "finance" | "notes" | "ideas";

export default function DashboardPage() {
  const [data, setData] = useState<FayData | null>(null);
  const [tab, setTab] = useState<Tab>("tiktok");
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => {
    setData(loadData());
  }, []);

  const update = useCallback((next: FayData) => {
    setData(next);
    saveData(next);
  }, []);

  if (!data) return null;

  const totalFollowers = data.tiktokAccounts.reduce(
    (s, a) => s + a.followers,
    0
  );
  const totalRevenue = data.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = data.transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const pendingTasks = data.tasks.filter((t) => !t.done).length;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "tiktok", label: "TikTok", icon: "♪" },
    { id: "tasks", label: "Tasks", icon: "✓" },
    { id: "finance", label: "Finance", icon: "$" },
    { id: "notes", label: "Notes", icon: "✎" },
    { id: "ideas", label: "Ideas", icon: "✦" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#050508" }}>
      {/* Background orbs */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(157,78,221,0.08), transparent)",
          top: "0",
          right: "0",
          filter: "blur(80px)",
        }}
      />

      <NavBar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-1">Dashboard</h1>
          <p style={{ color: "#8888aa", fontSize: 14 }}>
            Everything about your business, in one place.
          </p>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Followers"
            value={totalFollowers.toLocaleString()}
            icon="♪"
            color="#9d4edd"
            sub={`${data.tiktokAccounts.length} accounts`}
          />
          <StatCard
            label="Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
            icon="$"
            color="#69ff47"
            sub="All time"
          />
          <StatCard
            label="Expenses"
            value={`$${totalExpenses.toLocaleString()}`}
            icon="↓"
            color="#ff4747"
            sub={`Net: $${(totalRevenue - totalExpenses).toLocaleString()}`}
          />
          <StatCard
            label="Pending Tasks"
            value={pendingTasks}
            icon="✓"
            color="#00e5ff"
            sub={`${data.tasks.length} total`}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background:
                  tab === t.id ? "rgba(157,78,221,0.2)" : "rgba(18,18,28,0.6)",
                color: tab === t.id ? "#e040fb" : "#8888aa",
                border:
                  tab === t.id
                    ? "1px solid rgba(157,78,221,0.4)"
                    : "1px solid rgba(42,42,64,0.4)",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "tiktok" && (
              <TikTokTab data={data} update={update} onModal={setModal} />
            )}
            {tab === "tasks" && <TasksTab data={data} update={update} />}
            {tab === "finance" && <FinanceTab data={data} update={update} />}
            {tab === "notes" && <NotesTab data={data} update={update} />}
            {tab === "ideas" && <IdeasTab data={data} update={update} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add TikTok Account Modal */}
      <AnimatePresence>
        {modal === "add-tiktok" && (
          <AddTikTokModal
            onClose={() => setModal(null)}
            onAdd={(account) => {
              update({
                ...data,
                tiktokAccounts: [...data.tiktokAccounts, account],
              });
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TikTok Tab ────────────────────────────────────────────────────────────────
function TikTokTab({
  data,
  update,
  onModal,
}: {
  data: FayData;
  update: (d: FayData) => void;
  onModal: (m: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(
    data.tiktokAccounts[0]?.id || null
  );
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);

  const account = data.tiktokAccounts.find((a) => a.id === selected);

  async function generateIdeas() {
    if (!account) return;
    setGeneratingIdeas(true);
    try {
      const topVideos = [...(account.videos || [])]
        .sort((a, b) => b.views - a.views)
        .slice(0, 3);
      const res = await fetch("/api/tiktok-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: account.niche,
          topVideos,
          recentComments: "",
        }),
      });
      const { ideas } = await res.json();
      const newIdeas: ContentIdea[] = ideas.map(
        (i: { concept: string; hook: string; reason: string }) => ({
          id: Date.now().toString() + Math.random(),
          accountId: account.id,
          idea: i.concept,
          hook: i.hook,
          source: "fay-suggestion" as const,
          createdAt: new Date().toISOString(),
          used: false,
        })
      );
      update({
        ...data,
        contentIdeas: [...data.contentIdeas, ...newIdeas],
      });
    } finally {
      setGeneratingIdeas(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#f0f0ff" }}>
          TikTok Accounts
        </h2>
        <button
          onClick={() => onModal("add-tiktok")}
          className="px-4 py-2 rounded-xl text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)" }}
        >
          + Add Account
        </button>
      </div>

      {data.tiktokAccounts.length === 0 ? (
        <EmptyState
          icon="♪"
          text="No TikTok accounts yet"
          sub="Add your first account to start tracking"
        />
      ) : (
        <>
          {/* Account selector */}
          <div className="flex gap-3 overflow-x-auto pb-1">
            {data.tiktokAccounts.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelected(a.id)}
                className="px-4 py-3 rounded-2xl text-sm whitespace-nowrap transition-all text-left"
                style={{
                  background:
                    selected === a.id
                      ? "rgba(157,78,221,0.2)"
                      : "rgba(18,18,28,0.8)",
                  border:
                    selected === a.id
                      ? "1px solid rgba(157,78,221,0.5)"
                      : "1px solid rgba(42,42,64,0.6)",
                  minWidth: 140,
                }}
              >
                <div
                  className="font-semibold"
                  style={{ color: selected === a.id ? "#e040fb" : "#f0f0ff" }}
                >
                  @{a.username}
                </div>
                <div className="text-xs mt-1" style={{ color: "#8888aa" }}>
                  {a.followers.toLocaleString()} followers
                </div>
              </button>
            ))}
          </div>

          {account && (
            <div className="space-y-4">
              {/* Account stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  label="Followers"
                  value={account.followers.toLocaleString()}
                  color="#9d4edd"
                />
                <StatCard
                  label="Niche"
                  value={account.niche}
                  color="#e040fb"
                />
                <StatCard
                  label="Videos"
                  value={account.videos?.length || 0}
                  color="#00e5ff"
                />
                <StatCard
                  label="Avg Views"
                  value={
                    account.videos?.length
                      ? Math.round(
                          account.videos.reduce((s, v) => s + v.views, 0) /
                            account.videos.length
                        ).toLocaleString()
                      : "—"
                  }
                  color="#69ff47"
                />
              </div>

              {/* Videos */}
              <div
                className="rounded-2xl p-5"
                style={{
                  background: "rgba(18,18,28,0.8)",
                  border: "1px solid rgba(42,42,64,0.6)",
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="font-semibold"
                    style={{ color: "#f0f0ff" }}
                  >
                    Videos
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={generateIdeas}
                      disabled={generatingIdeas}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                      style={{
                        background: "rgba(0,229,255,0.15)",
                        border: "1px solid rgba(0,229,255,0.3)",
                        color: "#00e5ff",
                      }}
                    >
                      {generatingIdeas ? "Generating..." : "✦ AI Ideas"}
                    </button>
                    <button
                      onClick={() => setAddVideoOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{
                        background: "rgba(157,78,221,0.15)",
                        border: "1px solid rgba(157,78,221,0.3)",
                        color: "#9d4edd",
                      }}
                    >
                      + Add Video
                    </button>
                  </div>
                </div>

                {!account.videos?.length ? (
                  <p className="text-sm text-center py-6" style={{ color: "#8888aa" }}>
                    No videos tracked yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...account.videos]
                      .sort((a, b) => b.views - a.views)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 rounded-xl"
                          style={{ background: "rgba(5,5,8,0.6)" }}
                        >
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "#f0f0ff" }}
                            >
                              {v.title}
                            </p>
                            {v.hook && (
                              <p
                                className="text-xs mt-0.5 truncate italic"
                                style={{ color: "#8888aa" }}
                              >
                                Hook: "{v.hook}"
                              </p>
                            )}
                          </div>
                          <div className="flex gap-4 ml-4 text-xs" style={{ color: "#8888aa" }}>
                            <span>👁 {v.views.toLocaleString()}</span>
                            <span>❤️ {v.likes.toLocaleString()}</span>
                            <span>💬 {v.comments.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Update followers */}
              <UpdateFollowersRow account={account} data={data} update={update} />
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {addVideoOpen && account && (
          <AddVideoModal
            onClose={() => setAddVideoOpen(false)}
            onAdd={(video) => {
              const updated = data.tiktokAccounts.map((a) =>
                a.id === account.id
                  ? { ...a, videos: [...(a.videos || []), video] }
                  : a
              );
              update({ ...data, tiktokAccounts: updated });
              setAddVideoOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function UpdateFollowersRow({
  account,
  data,
  update,
}: {
  account: TikTokAccount;
  data: FayData;
  update: (d: FayData) => void;
}) {
  const [val, setVal] = useState("");
  function handleUpdate() {
    const n = parseInt(val);
    if (isNaN(n)) return;
    const updated = data.tiktokAccounts.map((a) =>
      a.id === account.id
        ? {
            ...a,
            followers: n,
            followerHistory: [
              ...(a.followerHistory || []),
              { date: new Date().toISOString().split("T")[0], count: n },
            ],
            lastUpdated: new Date().toISOString(),
          }
        : a
    );
    update({ ...data, tiktokAccounts: updated });
    setVal("");
  }
  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Update follower count"
        className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
        style={{
          background: "rgba(18,18,28,0.8)",
          border: "1px solid rgba(42,42,64,0.6)",
        }}
      />
      <button
        onClick={handleUpdate}
        disabled={!val}
        className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40"
        style={{
          background: "linear-gradient(135deg, #9d4edd, #e040fb)",
          color: "#fff",
        }}
      >
        Update
      </button>
    </div>
  );
}

// ─── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({
  data,
  update,
}: {
  data: FayData;
  update: (d: FayData) => void;
}) {
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  function addTask() {
    if (!text.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: text.trim(),
      done: false,
      priority,
      createdAt: new Date().toISOString(),
    };
    update({ ...data, tasks: [task, ...data.tasks] });
    setText("");
  }

  function toggleTask(id: string) {
    update({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    });
  }

  function deleteTask(id: string) {
    update({ ...data, tasks: data.tasks.filter((t) => t.id !== id) });
  }

  const priorityColors = {
    high: "#ff4747",
    medium: "#e040fb",
    low: "#8888aa",
  };

  return (
    <div className="space-y-4">
      <div
        className="flex gap-3 p-4 rounded-2xl"
        style={{
          background: "rgba(18,18,28,0.8)",
          border: "1px solid rgba(42,42,64,0.6)",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task["priority"])}
          className="bg-transparent text-xs outline-none"
          style={{ color: priorityColors[priority] }}
        >
          <option value="high" style={{ background: "#0d0d14" }}>High</option>
          <option value="medium" style={{ background: "#0d0d14" }}>Medium</option>
          <option value="low" style={{ background: "#0d0d14" }}>Low</option>
        </select>
        <button
          onClick={addTask}
          disabled={!text.trim()}
          className="px-4 py-1.5 rounded-xl text-sm font-medium disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)", color: "#fff" }}
        >
          Add
        </button>
      </div>

      {data.tasks.length === 0 ? (
        <EmptyState icon="✓" text="No tasks yet" sub="Add your first task above" />
      ) : (
        <div className="space-y-2">
          {data.tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: "rgba(18,18,28,0.8)",
                border: "1px solid rgba(42,42,64,0.6)",
                opacity: task.done ? 0.5 : 1,
              }}
            >
              <button
                onClick={() => toggleTask(task.id)}
                className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={{
                  borderColor: task.done ? "#69ff47" : priorityColors[task.priority],
                  background: task.done ? "#69ff4722" : "transparent",
                }}
              >
                {task.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5l2 2 4-4" stroke="#69ff47" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              <span
                className="flex-1 text-sm"
                style={{
                  color: task.done ? "#8888aa" : "#f0f0ff",
                  textDecoration: task.done ? "line-through" : "none",
                }}
              >
                {task.text}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: `${priorityColors[task.priority]}22`,
                  color: priorityColors[task.priority],
                }}
              >
                {task.priority}
              </span>
              <button onClick={() => deleteTask(task.id)} style={{ color: "#8888aa" }}>
                ×
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Finance Tab ───────────────────────────────────────────────────────────────
function FinanceTab({
  data,
  update,
}: {
  data: FayData;
  update: (d: FayData) => void;
}) {
  const [form, setForm] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    description: "",
    category: "",
  });

  function addTransaction() {
    if (!form.amount || !form.description) return;
    const t: Transaction = {
      id: Date.now().toString(),
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category || "General",
      date: new Date().toISOString(),
    };
    update({ ...data, transactions: [t, ...data.transactions] });
    setForm({ type: "income", amount: "", description: "", category: "" });
  }

  const net =
    data.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0) -
    data.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-4">
      <div
        className="p-4 rounded-2xl space-y-3"
        style={{
          background: "rgba(18,18,28,0.8)",
          border: "1px solid rgba(42,42,64,0.6)",
        }}
      >
        <div className="flex gap-2">
          {(["income", "expense"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setForm((f) => ({ ...f, type }))}
              className="flex-1 py-2 rounded-xl text-sm font-medium capitalize transition-all"
              style={{
                background:
                  form.type === type
                    ? type === "income"
                      ? "rgba(105,255,71,0.2)"
                      : "rgba(255,71,71,0.2)"
                    : "transparent",
                border:
                  form.type === type
                    ? `1px solid ${type === "income" ? "#69ff47" : "#ff4747"}44`
                    : "1px solid rgba(42,42,64,0.4)",
                color:
                  form.type === type
                    ? type === "income"
                      ? "#69ff47"
                      : "#ff4747"
                    : "#8888aa",
              }}
            >
              {type === "income" ? "↑ Income" : "↓ Expense"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Amount ($)"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="px-3 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.6)" }}
          />
          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="px-3 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.6)" }}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
            style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.6)" }}
          />
          <button
            onClick={addTransaction}
            disabled={!form.amount || !form.description}
            className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)", color: "#fff" }}
          >
            Add
          </button>
        </div>
      </div>

      <div
        className="p-4 rounded-2xl flex items-center justify-between"
        style={{
          background: net >= 0 ? "rgba(105,255,71,0.08)" : "rgba(255,71,71,0.08)",
          border: `1px solid ${net >= 0 ? "rgba(105,255,71,0.3)" : "rgba(255,71,71,0.3)"}`,
        }}
      >
        <span className="text-sm" style={{ color: "#8888aa" }}>Net Balance</span>
        <span
          className="text-2xl font-bold"
          style={{ color: net >= 0 ? "#69ff47" : "#ff4747" }}
        >
          {net >= 0 ? "+" : ""}${net.toLocaleString()}
        </span>
      </div>

      <div className="space-y-2">
        {data.transactions.length === 0 ? (
          <EmptyState icon="$" text="No transactions yet" sub="Add income or expenses above" />
        ) : (
          data.transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 rounded-2xl"
              style={{
                background: "rgba(18,18,28,0.8)",
                border: "1px solid rgba(42,42,64,0.6)",
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: "#f0f0ff" }}>
                  {t.description}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#8888aa" }}>
                  {t.category} · {new Date(t.date).toLocaleDateString()}
                </p>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: t.type === "income" ? "#69ff47" : "#ff4747" }}
              >
                {t.type === "income" ? "+" : "-"}${t.amount.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Notes Tab ─────────────────────────────────────────────────────────────────
function NotesTab({
  data,
  update,
}: {
  data: FayData;
  update: (d: FayData) => void;
}) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  function addNote() {
    if (!text.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: text.trim(),
      createdAt: new Date().toISOString(),
      tags: [],
    };
    update({ ...data, notes: [note, ...data.notes] });
    setText("");
  }

  function deleteNote(id: string) {
    update({ ...data, notes: data.notes.filter((n) => n.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div
        className="flex gap-3 p-4 rounded-2xl"
        style={{
          background: "rgba(18,18,28,0.8)",
          border: "1px solid rgba(42,42,64,0.6)",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Capture an idea, note, or thought..."
          rows={3}
          className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none resize-none"
        />
        <button
          onClick={addNote}
          disabled={!text.trim()}
          className="px-4 py-2 rounded-xl text-sm font-medium self-end disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)", color: "#fff" }}
        >
          Save
        </button>
      </div>

      {data.notes.length === 0 ? (
        <EmptyState icon="✎" text="No notes yet" sub="Write your first note above" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.notes.map((note) => (
            <motion.div
              key={note.id}
              layout
              whileHover={{ y: -2 }}
              className="p-4 rounded-2xl relative group"
              style={{
                background: "rgba(18,18,28,0.8)",
                border: "1px solid rgba(42,42,64,0.6)",
              }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#e0e0f0" }}>
                {note.content}
              </p>
              <p className="text-xs mt-3" style={{ color: "#8888aa" }}>
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-lg"
                style={{ color: "#8888aa" }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Ideas Tab ─────────────────────────────────────────────────────────────────
function IdeasTab({
  data,
  update,
}: {
  data: FayData;
  update: (d: FayData) => void;
}) {
  function markUsed(id: string) {
    update({
      ...data,
      contentIdeas: data.contentIdeas.map((i) =>
        i.id === id ? { ...i, used: true } : i
      ),
    });
  }

  function deleteIdea(id: string) {
    update({ ...data, contentIdeas: data.contentIdeas.filter((i) => i.id !== id) });
  }

  const unused = data.contentIdeas.filter((i) => !i.used);
  const used = data.contentIdeas.filter((i) => i.used);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "#f0f0ff" }}>
          Content Ideas
        </h2>
        <span className="text-sm" style={{ color: "#8888aa" }}>
          {unused.length} unused · {used.length} used
        </span>
      </div>

      {data.contentIdeas.length === 0 ? (
        <EmptyState
          icon="✦"
          text="No ideas yet"
          sub='Go to a TikTok account and tap "AI Ideas" to generate content'
        />
      ) : (
        <div className="space-y-3">
          {unused.map((idea) => {
            const account = data.tiktokAccounts.find((a) => a.id === idea.accountId);
            return (
              <motion.div
                key={idea.id}
                layout
                whileHover={{ y: -1 }}
                className="p-4 rounded-2xl"
                style={{
                  background: "rgba(18,18,28,0.8)",
                  border: "1px solid rgba(157,78,221,0.25)",
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {account && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "rgba(157,78,221,0.15)",
                            color: "#9d4edd",
                          }}
                        >
                          @{account.username}
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(0,229,255,0.1)",
                          color: "#00e5ff",
                        }}
                      >
                        {idea.source === "fay-suggestion" ? "✦ Fay" : idea.source}
                      </span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#f0f0ff" }}>
                      {idea.idea}
                    </p>
                    {idea.hook && (
                      <p
                        className="text-xs mt-2 italic p-2 rounded-lg"
                        style={{
                          color: "#e040fb",
                          background: "rgba(224,64,251,0.08)",
                        }}
                      >
                        Hook: "{idea.hook}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => markUsed(idea.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium"
                      style={{
                        background: "rgba(105,255,71,0.15)",
                        border: "1px solid rgba(105,255,71,0.3)",
                        color: "#69ff47",
                      }}
                    >
                      Used ✓
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      className="px-2 py-1.5 rounded-xl text-xs"
                      style={{ color: "#8888aa" }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {used.length > 0 && (
            <details>
              <summary
                className="text-sm cursor-pointer select-none"
                style={{ color: "#8888aa" }}
              >
                {used.length} used ideas
              </summary>
              <div className="space-y-2 mt-2 opacity-50">
                {used.map((idea) => (
                  <div
                    key={idea.id}
                    className="p-3 rounded-xl text-sm"
                    style={{
                      background: "rgba(18,18,28,0.5)",
                      border: "1px solid rgba(42,42,64,0.4)",
                      color: "#8888aa",
                      textDecoration: "line-through",
                    }}
                  >
                    {idea.idea}
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modals ────────────────────────────────────────────────────────────────────
function AddTikTokModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (a: TikTokAccount) => void;
}) {
  const [form, setForm] = useState({ username: "", niche: "", followers: "" });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.username || !form.niche) return;
    onAdd({
      id: Date.now().toString(),
      username: form.username.replace("@", ""),
      niche: form.niche,
      followers: parseInt(form.followers) || 0,
      followerHistory: [
        {
          date: new Date().toISOString().split("T")[0],
          count: parseInt(form.followers) || 0,
        },
      ],
      videos: [],
      lastUpdated: new Date().toISOString(),
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-bold mb-4 gradient-text">Add TikTok Account</h2>
      <form onSubmit={submit} className="space-y-3">
        <input
          placeholder="@username"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
          style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
        />
        <input
          placeholder="Niche (e.g. Beauty, Fitness, Finance)"
          value={form.niche}
          onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
          style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
        />
        <input
          type="number"
          placeholder="Current followers"
          value={form.followers}
          onChange={(e) => setForm((f) => ({ ...f, followers: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
          style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
        />
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ color: "#8888aa", border: "1px solid rgba(42,42,64,0.6)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)" }}
          >
            Add Account
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function AddVideoModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (v: import("../lib/types").TikTokVideo) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    hook: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    onAdd({
      id: Date.now().toString(),
      title: form.title,
      hook: form.hook,
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      comments: parseInt(form.comments) || 0,
      shares: parseInt(form.shares) || 0,
      date: new Date().toISOString(),
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <h2 className="text-lg font-bold mb-4 gradient-text">Add Video</h2>
      <form onSubmit={submit} className="space-y-3">
        <input
          placeholder="Video title / description"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
          style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
        />
        <input
          placeholder='Hook (first 3 seconds, e.g. "POV: you finally...")'
          value={form.hook}
          onChange={(e) => setForm((f) => ({ ...f, hook: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
          style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
        />
        <div className="grid grid-cols-2 gap-2">
          {(["views", "likes", "comments", "shares"] as const).map((f) => (
            <input
              key={f}
              type="number"
              placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f]: e.target.value }))}
              className="px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none"
              style={{ background: "rgba(5,5,8,0.8)", border: "1px solid rgba(42,42,64,0.8)" }}
            />
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm"
            style={{ color: "#8888aa", border: "1px solid rgba(42,42,64,0.6)" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
            style={{ background: "linear-gradient(135deg, #9d4edd, #e040fb)" }}
          >
            Add Video
          </button>
        </div>
      </form>
    </ModalOverlay>
  );
}

function ModalOverlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl p-6"
        style={{
          background: "#12121c",
          border: "1px solid rgba(42,42,64,0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function EmptyState({
  icon,
  text,
  sub,
}: {
  icon: string;
  text: string;
  sub: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="text-4xl mb-3 opacity-30">{icon}</div>
      <p className="font-medium" style={{ color: "#f0f0ff" }}>
        {text}
      </p>
      <p className="text-sm mt-1" style={{ color: "#8888aa" }}>
        {sub}
      </p>
    </div>
  );
}
