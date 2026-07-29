import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutDashboard, Music2, Newspaper, Users, Upload, Search, Bell, ChevronDown, MoreHorizontal, Check, X, Trash2, Edit3, Plus, Video, Lock, Eye, EyeOff, LogOut, Mail, Link as LinkIcon } from "lucide-react";

// ---------- Supabase connection ----------
// The anon key below is safe to use in frontend code — real security comes
// from the Row Level Security rules on the database, not from hiding this key.
const supabase = createClient(
  "https://kqgnpryubgdtmtcjtasi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZ25wcnl1YmdkdG10Y2p0YXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTQ1NjQsImV4cCI6MjA5OTczMDU2NH0.T0y1CVCzIvfmK4vgczmlpiAFZP63MRLZT5eymu8R6jY"
);

// ---------- Mock data ----------
const initialContent = [
  { id: 1, title: "Nothing Is Impossible", artist: "Mercy Chinwo", type: "Video", status: "Published", views: "1.2M", date: "2026-07-01" },
  { id: 2, title: "Way Maker (Live Session)", artist: "Sinach", type: "Video", status: "Published", views: "980K", date: "2026-06-28" },
  { id: 3, title: "Onyeoma", artist: "Tope Alabi", type: "Audio", status: "Published", views: "12K", date: "2026-07-14", streamingLink: "https://open.spotify.com/track/example" },
  { id: 4, title: "Choir Cover: Great Is Your Faithfulness", artist: "Lagos Community Choir", type: "Video", status: "Published", views: "3K", date: "2026-07-15" },
  { id: 5, title: "Sound of Grace Concert Highlights", artist: "Various Artists", type: "Video", status: "Published", views: "158K", date: "2026-06-20" },
];

const initialGist = [
  { id: 1, title: "Inside the Sound of Grace concert: what actually happened backstage", category: "Concert", status: "Published", reads: "4.2K", date: "2026-07-14" },
  { id: 2, title: "Is a joint album coming? Two top gospel acts spark speculation", category: "Rumor", status: "Draft", reads: "—", date: "2026-07-15" },
  { id: 3, title: "Meet the Lagos choir whose cover just crossed 200K views", category: "Community", status: "Published", reads: "2.6K", date: "2026-07-10" },
];

const initialUsers = [
  { id: 1, name: "Grace O.", email: "grace.o@email.com", role: "Viewer", joined: "2026-03-12", status: "Active" },
  { id: 2, name: "Emeka N.", email: "emeka.n@email.com", role: "Uploader", joined: "2026-05-02", status: "Active" },
  { id: 3, name: "Blessing A.", email: "blessing.a@email.com", role: "Viewer", joined: "2026-07-08", status: "Flagged" },
];

const initialComments = [
  { id: 1, user: "Grace O.", text: "This blessed my morning so much, thank you 🙏", on: "Nothing Is Impossible", status: "Visible" },
  { id: 2, user: "unknown_user22", text: "Check my page for free giveaways!!!", on: "Way Maker (Live Session)", status: "Flagged" },
  { id: 3, user: "Emeka N.", text: "The choir arrangement on this is incredible", on: "Choir Cover", status: "Visible" },
];

// ---------- Shared UI ----------
function StatusPill({ status }) {
  const map = {
    Published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Unpublished: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Flagged: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    Visible: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  return (
    <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${map[status] || ""}`}>
      {status}
    </span>
  );
}

function SidebarLink({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-amber-500/10 text-amber-400" : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
      }`}
    >
      <Icon size={17} strokeWidth={2} />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="text-[10px] font-mono bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full">{badge}</span>
      ) : null}
    </button>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2">{label}</div>
      <div className="text-2xl font-semibold text-zinc-50 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>{value}</div>
      <div className="text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

// ---------- Pages ----------
function Dashboard({ content, gist, users, comments }) {
  const liveCount = content.filter((c) => c.status === "Published").length;
  const flaggedComments = comments.filter((c) => c.status === "Flagged").length;
  const flaggedUsers = users.filter((u) => u.status === "Flagged").length;

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Content" value={content.length} sub="songs & videos" />
        <StatCard label="Live on Site" value={liveCount} sub="published now" />
        <StatCard label="Gist Articles" value={gist.length} sub="published & draft" />
        <StatCard label="Registered Users" value={users.length} sub="+2 this week" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-100">Needs your attention</h3>
          </div>
          <div className="space-y-3">
            {flaggedComments === 0 && flaggedUsers === 0 && (
              <div className="text-sm text-zinc-500">All clear — nothing flagged right now.</div>
            )}
            {flaggedComments > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="text-zinc-200">{flaggedComments} flagged comment{flaggedComments > 1 ? "s" : ""}</div>
                <StatusPill status="Flagged" />
              </div>
            )}
            {flaggedUsers > 0 && (
              <div className="flex items-center justify-between text-sm pt-3 border-t border-zinc-800">
                <div className="text-zinc-200">{flaggedUsers} flagged user{flaggedUsers > 1 ? "s" : ""}</div>
                <StatusPill status="Flagged" />
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">Recent activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-zinc-300">New upload: <span className="text-zinc-100">Onyeoma</span></div>
                <div className="text-xs text-zinc-500">2 hours ago</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-zinc-300">Gist published: <span className="text-zinc-100">Sound of Grace concert</span></div>
                <div className="text-xs text-zinc-500">14 hours ago</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></div>
              <div>
                <div className="text-zinc-300">Comment flagged on <span className="text-zinc-100">Way Maker</span></div>
                <div className="text-xs text-zinc-500">1 day ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadForm({ onUpload }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [type, setType] = useState("Video");
  const [fileAttached, setFileAttached] = useState(false);
  const [streamingLink, setStreamingLink] = useState("");
  const [error, setError] = useState("");

  const reset = () => {
    setTitle(""); setArtist(""); setFileAttached(false); setStreamingLink(""); setError(""); setOpen(false);
  };

  const submit = () => {
    setError("");
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }
    if (!fileAttached && !streamingLink.trim()) {
      setError("Attach a file, or add a streaming link if you're not uploading the file directly.");
      return;
    }
    onUpload({
      id: Date.now(),
      title,
      artist,
      type,
      status: "Published",
      views: "0",
      date: new Date().toISOString().slice(0, 10),
      hasFile: fileAttached,
      streamingLink: fileAttached ? "" : streamingLink.trim(),
    });
    reset();
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
        <Plus size={16} /> Upload content
      </button>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Upload new song or video</h3>
        <button onClick={reset} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Nothing Is Impossible" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Artist</label>
          <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g. Mercy Chinwo" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50">
          <option>Video</option>
          <option>Audio</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">File</label>
        <button
          type="button"
          onClick={() => setFileAttached(!fileAttached)}
          className={`w-full border rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
            fileAttached ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-950 border-dashed border-zinc-800 text-zinc-500 hover:border-zinc-700"
          }`}
        >
          {fileAttached ? <Check size={14} /> : <Upload size={14} />}
          {fileAttached ? "File attached — nothing-is-impossible.mp3" : "Drop file or click to browse"}
        </button>
        <p className="text-[11px] text-zinc-600 mt-1.5">This is a placeholder — real file upload connects once the backend is wired up.</p>
      </div>

      {type === "Audio" && !fileAttached && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 mb-1.5 block">Streaming link <span className="text-zinc-600">(Spotify, Apple Music, Audiomack, etc — used if no file is uploaded)</span></label>
          <input
            value={streamingLink}
            onChange={e => setStreamingLink(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50"
          />
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <button onClick={submit} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">Publish</button>
    </div>
  );
}

function ContentTable({ content, setContent }) {
  const toggleStatus = (id) => setContent(content.map(c => c.id === id ? { ...c, status: c.status === "Published" ? "Unpublished" : "Published" } : c));
  const remove = (id) => setContent(content.filter(c => c.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: "'Fraunces', serif" }}>Songs &amp; Videos</h2>
          <p className="text-sm text-zinc-500 mt-1">Uploads publish straight to the live site</p>
        </div>
        <UploadForm onUpload={(item) => setContent([item, ...content])} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500 text-xs font-mono uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Views</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {content.map(c => (
              <tr key={c.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-gradient-to-br from-rose-800 to-zinc-900 flex items-center justify-center shrink-0">
                      {c.type === "Video" ? <Video size={14} className="text-amber-400" /> : <Music2 size={14} className="text-amber-400" />}
                    </div>
                    <div>
                      <div className="text-zinc-200 font-medium">{c.title}</div>
                      <div className="text-xs text-zinc-500">{c.artist}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-zinc-400">{c.type}</td>
                <td className="px-5 py-3.5">
                  {c.streamingLink ? (
                    <a href={c.streamingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline">
                      <LinkIcon size={12} /> Streaming link
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      <Check size={12} /> File
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5"><StatusPill status={c.status} /></td>
                <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">{c.views}</td>
                <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs">{c.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => toggleStatus(c.id)} title={c.status === "Published" ? "Unpublish" : "Publish"} className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => remove(c.id)} title="Delete" className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GistManager({ gist, setGist }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Community");

  const publish = () => {
    if (!title.trim()) return;
    setGist([{ id: Date.now(), title, category, status: "Draft", reads: "—", date: new Date().toISOString().slice(0, 10) }, ...gist]);
    setTitle(""); setOpen(false);
  };

  const toggleStatus = (id) => setGist(gist.map(g => g.id === id ? { ...g, status: g.status === "Published" ? "Draft" : "Published" } : g));
  const remove = (id) => setGist(gist.filter(g => g.id !== id));

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: "'Fraunces', serif" }}>Gist Articles</h2>
          <p className="text-sm text-zinc-500 mt-1">Write and manage entertainment news</p>
        </div>
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={16} /> New article
        </button>
      </div>

      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <label className="text-xs text-zinc-500 mb-1.5 block">Headline</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Behind the scenes at..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50">
                <option>Concert</option>
                <option>Rumor</option>
                <option>Community</option>
                <option>Release</option>
              </select>
            </div>
          </div>
          <button onClick={publish} className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">Save as draft</button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-zinc-500 text-xs font-mono uppercase tracking-wider">
              <th className="px-5 py-3 font-medium">Headline</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Reads</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {gist.map(g => (
              <tr key={g.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                <td className="px-5 py-3.5 text-zinc-200 font-medium max-w-xs">{g.title}</td>
                <td className="px-5 py-3.5 text-zinc-400">{g.category}</td>
                <td className="px-5 py-3.5"><StatusPill status={g.status} /></td>
                <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">{g.reads}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => toggleStatus(g.id)} title="Toggle publish" className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => remove(g.id)} title="Delete" className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersAndComments({ users, setUsers, comments, setComments, role }) {
  const [tab, setTab] = useState("users");
  const isSuperAdmin = role === "super_admin";
  const toggleUserStatus = (id) => setUsers(users.map(u => u.id === id ? { ...u, status: u.status === "Active" ? "Flagged" : "Active" } : u));
  const removeComment = (id) => setComments(comments.filter(c => c.id !== id));
  const toggleComment = (id) => setComments(comments.map(c => c.id === id ? { ...c, status: c.status === "Visible" ? "Flagged" : "Visible" } : c));

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-50 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Users &amp; Comments</h2>
      <p className="text-sm text-zinc-500 mb-5">Manage community members and moderate discussion</p>

      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("users")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "users" ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Users</button>
        <button onClick={() => setTab("comments")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "comments" ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Comments</button>
      </div>

      {tab === "users" ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500 text-xs font-mono uppercase tracking-wider">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-zinc-800/60 last:border-0 hover:bg-zinc-800/30">
                  <td className="px-5 py-3.5 text-zinc-200 font-medium">{u.name}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{u.email}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{u.role}</td>
                  <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs">{u.joined}</td>
                  <td className="px-5 py-3.5"><StatusPill status={u.status} /></td>
                  <td className="px-5 py-3.5">
                    {isSuperAdmin ? (
                      <button onClick={() => toggleUserStatus(u.id)} className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                        {u.status === "Active" ? "Flag" : "Unflag"}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-zinc-200">{c.user}</span>
                  <StatusPill status={c.status} />
                  <span className="text-xs text-zinc-600">on {c.on}</span>
                </div>
                <p className="text-sm text-zinc-400">{c.text}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleComment(c.id)} className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors" title="Toggle visibility">
                  {c.status === "Visible" ? <X size={14} /> : <Check size={14} />}
                </button>
                {isSuperAdmin && (
                  <button onClick={() => removeComment(c.id)} className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors" title="Delete">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Login screen ----------
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password.");
      return;
    }
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    // Confirm this account is actually staff (admin or super_admin) before letting them in
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      setError("This account doesn't have admin access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin(profile.role);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ambient glow */}
      <div className="pointer-events-none fixed -top-32 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, #D9A441, transparent 70%)" }}></div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
            <Lock size={18} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-0.5 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>
            <span className="text-xl font-semibold">MyGospelHub</span>
            <span className="text-amber-400 text-xl">.</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">Admin Console</div>
        </div>

        <form onSubmit={submit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="mb-4">
            <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mygospelhub.com"
                autoComplete="username"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="text-xs text-zinc-500 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-9 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500/50 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-6 font-mono">Restricted access · MyGospelHub staff only</p>
      </div>
    </div>
  );
}

// ---------- App shell ----------
function Dashboard_Shell({ onLogout, role }) {
  const [page, setPage] = useState("dashboard");
  const [content, setContent] = useState(initialContent);
  const [gist, setGist] = useState(initialGist);
  const [users, setUsers] = useState(initialUsers);
  const [comments, setComments] = useState(initialComments);

  const flaggedCount = comments.filter(c => c.status === "Flagged").length + users.filter(u => u.status === "Flagged").length;

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "content", label: "Songs & Videos", icon: Music2 },
    { key: "gist", label: "Gist Articles", icon: Newspaper },
    { key: "users", label: "Users & Comments", icon: Users, badge: flaggedCount || null },
  ];

  const pageTitle = { dashboard: "Dashboard", content: "Songs & Videos", gist: "Gist Articles", users: "Users & Comments" }[page];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 border-r border-zinc-800 flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-zinc-800">
          <div className="flex items-baseline gap-0.5" style={{ fontFamily: "'Fraunces', serif" }}>
            <span className="text-lg font-semibold">MyGospelHub</span>
            <span className="text-amber-400 text-lg">.</span>
          </div>
          <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">Admin Console</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <SidebarLink key={item.key} icon={item.icon} label={item.label} active={page === item.key} onClick={() => setPage(item.key)} badge={item.badge} />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-rose-800 shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-zinc-200 font-medium truncate">Admin</div>
            <div className="text-xs text-zinc-500 truncate">admin@mygospelhub.com</div>
          </div>
          <button onClick={onLogout} title="Sign out" className="p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors shrink-0">
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>Admin</span>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input placeholder="Search..." className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-zinc-200 outline-none focus:border-amber-500/50 w-48" />
            </div>
            <button className="relative p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors">
              <Bell size={16} />
              {flaggedCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {page === "dashboard" && <Dashboard content={content} gist={gist} users={users} comments={comments} />}
          {page === "content" && <ContentTable content={content} setContent={setContent} />}
          {page === "gist" && <GistManager gist={gist} setGist={setGist} />}
          {page === "users" && <UsersAndComments users={users} setUsers={setUsers} comments={comments} setComments={setComments} role={role} />}
        </main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setRole(null);
  };

  if (!loggedIn) {
    return <LoginScreen onLogin={(userRole) => { setRole(userRole); setLoggedIn(true); }} />;
  }
  return <Dashboard_Shell onLogout={handleLogout} role={role} />;
}
