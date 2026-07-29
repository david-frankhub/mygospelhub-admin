import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { LayoutDashboard, Music2, Newspaper, Users, Upload, Search, Bell, ChevronDown, MoreHorizontal, Check, X, Trash2, Edit3, Plus, Video, Lock, Eye, EyeOff, LogOut, Mail, Link as LinkIcon, Loader2 } from "lucide-react";

// ---------- Supabase connection ----------
// The anon key below is safe to use in frontend code — real security comes
// from the Row Level Security rules on the database, not from hiding this key.
const supabase = createClient(
  "https://kqgnpryubgdtmtcjtasi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZ25wcnl1YmdkdG10Y2p0YXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNTQ1NjQsImV4cCI6MjA5OTczMDU2NH0.T0y1CVCzIvfmK4vgczmlpiAFZP63MRLZT5eymu8R6jY"
);

// ---------- Helpers ----------
function timeAgo(dateString) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatCount(n) {
  if (n == null) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// ---------- Shared UI ----------
function StatusPill({ status }) {
  const map = {
    Published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Draft: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Unpublished: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    Rejected: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
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

function LoadingBlock({ label = "Loading..." }) {
  return (
    <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm py-16">
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  );
}

function ErrorBlock({ message, onRetry }) {
  return (
    <div className="text-center py-16">
      <p className="text-sm text-rose-400 mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs text-amber-400 hover:underline">Try again</button>
      )}
    </div>
  );
}

// ---------- Pages ----------
function Dashboard({ content, gist, users, comments }) {
  const liveCount = content.filter((c) => c.status === "Published").length;
  const flaggedComments = comments.filter((c) => c.status === "Flagged").length;
  const flaggedUsers = users.filter((u) => u.status === "Flagged").length;

  const recent = [...content, ...gist]
    .map(item => ({
      label: item.title,
      kind: item.category !== undefined ? "gist" : "content",
      date: item.created_at,
    }))
    .filter(item => item.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Content" value={content.length} sub="songs & videos" />
        <StatCard label="Live on Site" value={liveCount} sub="published now" />
        <StatCard label="Gist Articles" value={gist.length} sub="published & draft" />
        <StatCard label="Registered Users" value={users.length} sub="total" />
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
            {recent.length === 0 && <div className="text-zinc-500">No activity yet.</div>}
            {recent.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                <div>
                  <div className="text-zinc-300">
                    {item.kind === "gist" ? "Gist published: " : "New upload: "}
                    <span className="text-zinc-100">{item.label}</span>
                  </div>
                  <div className="text-xs text-zinc-500">{timeAgo(item.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const GENRES = ["Worship", "Praise", "Choir", "Yoruba", "Igbo", "Hausa", "Live Sessions", "Covers", "Events", "Testimonies"];

function UploadForm({ onUpload }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [type, setType] = useState("Video");
  const [genre, setGenre] = useState("Worship");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [fileAttached, setFileAttached] = useState(false);
  const [streamingLink, setStreamingLink] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setArtist(""); setGenre("Worship"); setYear(new Date().getFullYear());
    setDescription(""); setVideoUrl(""); setFileAttached(false); setStreamingLink("");
    setCoverFile(null); setCoverPreview(""); setError(""); setOpen(false);
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const submit = async () => {
    setError("");
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }
    if (!fileAttached && !streamingLink.trim()) {
      setError("Attach a file, or add a streaming link if you're not uploading the file directly.");
      return;
    }

    setSubmitting(true);

    // Upload cover art to Supabase Storage, if one was picked
    let coverUrl = null;
    if (coverFile) {
      const ext = coverFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, coverFile);
      if (uploadError) {
        setError("Cover art upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("content")
      .insert({
        title: title.trim(),
        artist: artist.trim(),
        type,
        genre,
        year: year ? Number(year) : null,
        description: description.trim() || null,
        video_url: videoUrl.trim() || null,
        cover_url: coverUrl,
        status: "Published",
        views: 0,
        // NOTE: real audio/video file upload to Supabase Storage isn't wired up yet —
        // file_url stays empty until that's built. Cover art and streaming link work today.
        file_url: null,
        streaming_link: fileAttached ? null : streamingLink.trim(),
      })
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError("Couldn't publish: " + insertError.message);
      return;
    }

    onUpload(data);
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

      <div className="flex gap-4 mb-4">
        <div className="shrink-0">
          <label className="text-xs text-zinc-500 mb-1.5 block">Cover art</label>
          <label className="w-24 h-24 rounded-lg border border-dashed border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-700 transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <Upload size={18} className="text-zinc-600" />
            )}
            <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
          </label>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Nothing Is Impossible" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Artist</label>
            <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="e.g. Mercy Chinwo" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50">
              <option>Video</option>
              <option>Audio</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Genre</label>
            <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50">
              {GENRES.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Year</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2026" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Official video link <span className="text-zinc-600">(optional)</span></label>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube link, etc." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">Description <span className="text-zinc-600">(optional)</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="A short note about the song or video..." rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-none" />
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
          {fileAttached ? "File attached (placeholder)" : "Drop file or click to browse"}
        </button>
        <p className="text-[11px] text-zinc-600 mt-1.5">Real audio/video file storage isn't wired up yet — this toggle just simulates it. Cover art and streaming link both work for real right now.</p>
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

      <button onClick={submit} disabled={submitting} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2">
        {submitting && <Loader2 size={14} className="animate-spin" />}
        {submitting ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}

function ContentTable({ content, setContent }) {
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Published" ? "Unpublished" : "Published";
    // optimistic update
    setContent(content.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from("content").update({ status: newStatus }).eq("id", id);
    if (error) {
      // revert on failure
      setContent(content.map(c => c.id === id ? { ...c, status: currentStatus } : c));
    }
  };

  const remove = async (id) => {
    const prev = content;
    setContent(content.filter(c => c.id !== id));
    const { error } = await supabase.from("content").delete().eq("id", id);
    if (error) setContent(prev);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-50" style={{ fontFamily: "'Fraunces', serif" }}>Songs &amp; Videos</h2>
          <p className="text-sm text-zinc-500 mt-1">Uploads publish straight to the live site</p>
        </div>
        <UploadForm onUpload={(item) => setContent([item, ...content])} />
      </div>

      {content.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-sm text-zinc-500">
          Nothing uploaded yet — use "Upload content" to add your first song or video.
        </div>
      ) : (
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
                      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-rose-800 to-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.cover_url ? (
                          <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          c.type === "Video" ? <Video size={14} className="text-amber-400" /> : <Music2 size={14} className="text-amber-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-zinc-200 font-medium">{c.title}</div>
                        <div className="text-xs text-zinc-500">{c.artist}{c.genre ? ` · ${c.genre}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{c.type}</td>
                  <td className="px-5 py-3.5">
                    {c.streaming_link ? (
                      <a href={c.s
