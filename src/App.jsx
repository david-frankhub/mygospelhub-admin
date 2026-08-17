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

// Converts any picked image (png, jpg, webp, etc.) into a real .jpeg file
// before it's uploaded. This matters because WhatsApp/Facebook's link
// preview crawler has been observed reliably showing .jpeg cover images
// but not always .jpg or .png ones — converting here means nobody uploading
// content ever has to think about file format again.
function convertImageToJpeg(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      // Fill white behind transparent PNGs so they don't turn black on JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) { reject(new Error("Image conversion failed")); return; }
          resolve(new File([blob], "cover.jpeg", { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.9
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Couldn't read image file")); };
    img.src = objectUrl;
  });
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
  const [producer, setProducer] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamingLink, setStreamingLink] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle(""); setArtist(""); setGenre("Worship"); setProducer(""); setYear(new Date().getFullYear());
    setDescription(""); setLyrics(""); setVideoUrl(""); setMediaFile(null); setUploadProgress(0); setStreamingLink("");
    setCoverFile(null); setCoverPreview(""); setError(""); setOpen(false);
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
  };

  const submit = async () => {
    setError("");
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }
    if (!mediaFile && !streamingLink.trim()) {
      setError("Attach a file, or add a streaming link if you're not uploading the file directly.");
      return;
    }

    setSubmitting(true);

    // Upload cover art to Supabase Storage, if one was picked.
    // Always convert to .jpeg first — see convertImageToJpeg for why.
    let coverUrl = null;
    if (coverFile) {
      let jpegFile;
      try {
        jpegFile = await convertImageToJpeg(coverFile);
      } catch (convertError) {
        setError("Couldn't process cover image: " + convertError.message);
        setSubmitting(false);
        return;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpeg`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, jpegFile);
      if (uploadError) {
        setError("Cover art upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    // Upload the actual song/video file to Supabase Storage, if one was picked
    let fileUrl = null;
    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      setUploadProgress(10); // show some initial movement while the upload starts
      const { error: uploadError } = await supabase.storage.from("media").upload(path, mediaFile);
      if (uploadError) {
        setError("File upload failed: " + uploadError.message);
        setSubmitting(false);
        setUploadProgress(0);
        return;
      }
      setUploadProgress(100);
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("content")
      .insert({
        title: title.trim(),
        artist: artist.trim(),
        type,
        genre,
        producer: producer.trim() || null,
        year: year ? Number(year) : null,
        description: description.trim() || null,
        lyrics: type === "Audio" ? (lyrics.trim() || null) : null,
        video_url: videoUrl.trim() || null,
        cover_url: coverUrl,
        status: "Published",
        views: 0,
        file_url: fileUrl,
        streaming_link: mediaFile ? null : streamingLink.trim(),
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
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. Worship, Afrogospel" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Year</label>
          <input type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2026" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Producer <span className="text-zinc-600">(optional)</span></label>
          <input value={producer} onChange={e => setProducer(e.target.value)} placeholder="e.g. Wilson Joel" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
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

      {type === "Audio" && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 mb-1.5 block">Lyrics <span className="text-zinc-600">(optional)</span></label>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} placeholder={"Paste or type the lyrics here...\nLine breaks are preserved as typed."} rows={6} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-y font-mono" />
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">File</label>
        <label
          className={`w-full border rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition-colors cursor-pointer ${
            mediaFile ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-zinc-950 border-dashed border-zinc-800 text-zinc-500 hover:border-zinc-700"
          }`}
        >
          {mediaFile ? <Check size={14} /> : <Upload size={14} />}
          <span className="truncate">
            {mediaFile ? `${mediaFile.name} (${(mediaFile.size / (1024 * 1024)).toFixed(1)} MB)` : "Tap to choose an audio or video file"}
          </span>
          <input type="file" accept={type === "Audio" ? "audio/*" : "video/*"} onChange={handleMediaSelect} className="hidden" />
        </label>
        {submitting && mediaFile && (
          <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 transition-all" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
        <p className="text-[11px] text-zinc-600 mt-1.5">Large files may take a moment to upload depending on your connection.</p>
      </div>

      {type === "Audio" && !mediaFile && (
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
        {submitting ? (mediaFile ? "Uploading file..." : "Publishing...") : "Publish"}
      </button>
    </div>
  );
}

function EditContentForm({ item, onSave, onCancel }) {
  const [title, setTitle] = useState(item.title || "");
  const [artist, setArtist] = useState(item.artist || "");
  const [genre, setGenre] = useState(item.genre || "");
  const [producer, setProducer] = useState(item.producer || "");
  const [year, setYear] = useState(item.year || new Date().getFullYear());
  const [description, setDescription] = useState(item.description || "");
  const [lyrics, setLyrics] = useState(item.lyrics || "");
  const [videoUrl, setVideoUrl] = useState(item.video_url || "");
  const [streamingLink, setStreamingLink] = useState(item.streaming_link || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(item.cover_url || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setError("");
    if (!title.trim() || !artist.trim()) {
      setError("Title and artist are required.");
      return;
    }
    setSaving(true);

    // Only touch cover_url if a new image was actually picked — otherwise
    // leave the existing one alone.
    let coverUrl = item.cover_url || null;
    if (coverFile) {
      let jpegFile;
      try {
        jpegFile = await convertImageToJpeg(coverFile);
      } catch (convertError) {
        setError("Couldn't process cover image: " + convertError.message);
        setSaving(false);
        return;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpeg`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, jpegFile);
      if (uploadError) {
        setError("Cover art upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    const { data, error: updateError } = await supabase
      .from("content")
      .update({
        title: title.trim(),
        artist: artist.trim(),
        genre: genre.trim() || null,
        producer: producer.trim() || null,
        year: year ? Number(year) : null,
        description: description.trim() || null,
        lyrics: item.type === "Audio" ? (lyrics.trim() || null) : item.lyrics,
        video_url: videoUrl.trim() || null,
        streaming_link: streamingLink.trim() || null,
        cover_url: coverUrl,
      })
      .eq("id", item.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      setError("Couldn't save changes: " + updateError.message);
      return;
    }

    onSave(data);
  };

  return (
    <div className="bg-zinc-900 border border-amber-500/30 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Editing: {item.title}</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
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
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Artist</label>
            <input value={artist} onChange={e => setArtist(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Genre</label>
            <input value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Year</label>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Producer <span className="text-zinc-600">(optional)</span></label>
          <input value={producer} onChange={e => setProducer(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 block">Official video link <span className="text-zinc-600">(optional)</span></label>
          <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-none" />
      </div>

      {item.type === "Audio" && (
        <div className="mb-4">
          <label className="text-xs text-zinc-500 mb-1.5 block">Lyrics <span className="text-zinc-600">(optional)</span></label>
          <textarea value={lyrics} onChange={e => setLyrics(e.target.value)} rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-y font-mono" />
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-1.5 block">Streaming link <span className="text-zinc-600">(used only if no file was uploaded)</span></label>
        <input value={streamingLink} onChange={e => setStreamingLink(e.target.value)} placeholder="https://open.spotify.com/track/..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
      </div>

      <p className="text-[11px] text-zinc-600 mb-4">To replace the audio/video file itself, delete this item and re-upload — editing here only changes the details shown above.</p>

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-200 text-sm font-medium px-4 py-2.5">Cancel</button>
      </div>
    </div>
  );
}

function ContentTable({ content, setContent }) {
  const [editingId, setEditingId] = useState(null);

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

      {editingId && (() => {
        const item = content.find(c => c.id === editingId);
        if (!item) return null;
        return (
          <EditContentForm
            item={item}
            onCancel={() => setEditingId(null)}
            onSave={(updated) => {
              setContent(content.map(c => c.id === updated.id ? updated : c));
              setEditingId(null);
            }}
          />
        );
      })()}

      {content.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-sm text-zinc-500">
          Nothing uploaded yet — use "Upload content" to add your first song or video.
        </div>
      ) : (
        <>
          {/* Mobile: stacked cards. Hidden on md+ screens. */}
          <div className="flex flex-col gap-3 md:hidden">
            {content.map(c => (
              <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-md bg-gradient-to-br from-rose-800 to-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
                    {c.cover_url ? (
                      <img src={c.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.type === "Video" ? <Video size={16} className="text-amber-400" /> : <Music2 size={16} className="text-amber-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-100 font-medium truncate">{c.title}</div>
                    <div className="text-xs text-zinc-500 truncate">{c.artist}{c.genre ? ` · ${c.genre}` : ""}</div>
                  </div>
                  <StatusPill status={c.status} />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500 mb-3.5">
                  <span>{c.type}</span>
                  <span className="font-mono">{formatCount(c.views)} views</span>
                  <span className="font-mono">{c.created_at ? c.created_at.slice(0, 10) : ""}</span>
                  {c.streaming_link ? (
                    <a href={c.streaming_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-amber-400">
                      <LinkIcon size={11} /> Streaming link
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1"><Check size={11} /> File</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setEditingId(c.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-800/60 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg transition-colors">
                    <Edit3 size={13} /> Edit
                  </button>
                  <button onClick={() => toggleStatus(c.id, c.status)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-800/60 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-lg transition-colors">
                    {c.status === "Published" ? <X size={13} /> : <Check size={13} />} {c.status === "Published" ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => remove(c.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-zinc-300 bg-zinc-800/60 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors">
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: full table. Hidden below md screens. */}
          <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
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
                      <a href={c.streaming_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:underline">
                        <LinkIcon size={12} /> Streaming link
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                        <Check size={12} /> File
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><StatusPill status={c.status} /></td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">{formatCount(c.views)}</td>
                  <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs">{c.created_at ? c.created_at.slice(0, 10) : ""}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditingId(c.id)} title="Edit details" className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => toggleStatus(c.id, c.status)} title={c.status === "Published" ? "Unpublish" : "Publish"} className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors">{c.status === "Published" ? <X size={14} /> : <Check size={14} />}</button>
                      <button onClick={() => remove(c.id)} title="Delete" className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </div>
  );
}

function EditGistForm({ item, onSave, onCancel }) {
  const [title, setTitle] = useState(item.title || "");
  const [category, setCategory] = useState(item.category || "Community");
  const [body, setBody] = useState(item.body || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(item.cover_url || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setError("");
    if (!title.trim()) {
      setError("Headline is required.");
      return;
    }
    setSaving(true);

    // Only touch cover_url if a new image was actually picked — otherwise
    // leave the existing one alone.
    let coverUrl = item.cover_url || null;
    if (coverFile) {
      let jpegFile;
      try {
        jpegFile = await convertImageToJpeg(coverFile);
      } catch (convertError) {
        setError("Couldn't process cover image: " + convertError.message);
        setSaving(false);
        return;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpeg`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, jpegFile);
      if (uploadError) {
        setError("Cover image upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    const { data, error: updateError } = await supabase
      .from("gist_articles")
      .update({
        title: title.trim(),
        category,
        body: body.trim() || null,
        cover_url: coverUrl,
      })
      .eq("id", item.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      setError("Couldn't save changes: " + updateError.message);
      return;
    }

    onSave(data);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Edit gist article</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="shrink-0">
          <label className="text-xs text-zinc-500 mb-1.5 block">Cover image</label>
          <label className="w-24 h-24 rounded-lg border border-dashed border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-700 transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <Upload size={18} className="text-zinc-600" />
            )}
            <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
          </label>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1.5 block">Headline</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
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
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1.5 block">Article body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function EditGistForm({ item, onSave, onCancel }) {
  const [title, setTitle] = useState(item.title || "");
  const [category, setCategory] = useState(item.category || "Community");
  const [body, setBody] = useState(item.body || "");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(item.cover_url || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setError("");
    if (!title.trim()) {
      setError("Headline is required.");
      return;
    }
    setSaving(true);

    // Only touch cover_url if a new image was actually picked — otherwise
    // leave the existing one alone.
    let coverUrl = item.cover_url || null;
    if (coverFile) {
      let jpegFile;
      try {
        jpegFile = await convertImageToJpeg(coverFile);
      } catch (convertError) {
        setError("Couldn't process cover image: " + convertError.message);
        setSaving(false);
        return;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpeg`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, jpegFile);
      if (uploadError) {
        setError("Cover image upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    const { data, error: updateError } = await supabase
      .from("gist_articles")
      .update({
        title: title.trim(),
        category,
        body: body.trim() || null,
        cover_url: coverUrl,
      })
      .eq("id", item.id)
      .select()
      .single();

    setSaving(false);

    if (updateError) {
      setError("Couldn't save changes: " + updateError.message);
      return;
    }

    onSave(data);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-zinc-100">Edit article</h3>
        <button onClick={onCancel} className="text-zinc-500 hover:text-zinc-300"><X size={18} /></button>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="shrink-0">
          <label className="text-xs text-zinc-500 mb-1.5 block">Cover image</label>
          <label className="w-24 h-24 rounded-lg border border-dashed border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-700 transition-colors">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <Upload size={18} className="text-zinc-600" />
            )}
            <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
          </label>
        </div>
        <div className="flex-1 grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs text-zinc-500 mb-1.5 block">Headline</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50" />
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
          <div className="col-span-3">
            <label className="text-xs text-zinc-500 mb-1.5 block">Article body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-none" />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium text-zinc-300 bg-zinc-800/60 hover:bg-zinc-800 rounded-lg transition-colors">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-zinc-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-lg transition-colors">
          {saving && <Loader2 size={14} className="animate-spin" />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function GistManager({ gist, setGist }) {
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Community");
  const [body, setBody] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle(""); setCategory("Community"); setBody("");
    setCoverFile(null); setCoverPreview(""); setError(""); setOpen(false);
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const publish = async () => {
    setError("");
    if (!title.trim()) {
      setError("Headline is required.");
      return;
    }
    setSubmitting(true);

    let coverUrl = null;
    if (coverFile) {
      let jpegFile;
      try {
        jpegFile = await convertImageToJpeg(coverFile);
      } catch (convertError) {
        setError("Couldn't process cover image: " + convertError.message);
        setSubmitting(false);
        return;
      }
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpeg`;
      const { error: uploadError } = await supabase.storage.from("covers").upload(path, jpegFile);
      if (uploadError) {
        setError("Cover image upload failed: " + uploadError.message);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("gist_articles")
      .insert({ title: title.trim(), category, body: body.trim() || null, cover_url: coverUrl, status: "Draft", reads: 0 })
      .select()
      .single();
    setSubmitting(false);

    if (insertError) {
      setError("Couldn't save: " + insertError.message);
      return;
    }
    setGist([data, ...gist]);
    resetForm();
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Published" ? "Draft" : "Published";
    setGist(gist.map(g => g.id === id ? { ...g, status: newStatus } : g));
    const { error } = await supabase.from("gist_articles").update({ status: newStatus }).eq("id", id);
    if (error) setGist(gist.map(g => g.id === id ? { ...g, status: currentStatus } : g));
  };

  const remove = async (id) => {
    const prev = gist;
    setGist(gist.filter(g => g.id !== id));
    const { error } = await supabase.from("gist_articles").delete().eq("id", id);
    if (error) setGist(prev);
  };

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

      {editingId && (() => {
        const item = gist.find(g => g.id === editingId);
        if (!item) return null;
        return (
          <EditGistForm
            item={item}
            onCancel={() => setEditingId(null)}
            onSave={(updated) => {
              setGist(gist.map(g => g.id === updated.id ? updated : g));
              setEditingId(null);
            }}
          />
        );
      })()}

      {open && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="shrink-0">
              <label className="text-xs text-zinc-500 mb-1.5 block">Cover image</label>
              <label className="w-24 h-24 rounded-lg border border-dashed border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-700 transition-colors">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={18} className="text-zinc-600" />
                )}
                <input type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
              </label>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
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
              <div className="col-span-3">
                <label className="text-xs text-zinc-500 mb-1.5 block">Article body</label>
                <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write the full story here..." rows={5} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/50 resize-none" />
              </div>
            </div>
          </div>
          {error && (
            <div className="mb-4 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">{error}</div>
          )}
          <button onClick={publish} disabled={submitting} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-zinc-950 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2">
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? "Saving..." : "Save as draft"}
          </button>
        </div>
      )}

      {gist.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-sm text-zinc-500">
          No gist articles yet — tap "New article" to write your first one.
        </div>
      ) : (
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
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {g.cover_url && (
                        <div className="w-9 h-9 rounded-md overflow-hidden shrink-0">
                          <img src={g.cover_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-zinc-200 font-medium max-w-xs">{g.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-400">{g.category}</td>
                  <td className="px-5 py-3.5"><StatusPill status={g.status} /></td>
                  <td className="px-5 py-3.5 text-zinc-400 font-mono text-xs">{formatCount(g.reads)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditingId(g.id)} title="Edit details" className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"><Edit3 size={14} /></button>
                      <button onClick={() => toggleStatus(g.id, g.status)} title={g.status === "Published" ? "Unpublish" : "Publish"} className="p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-md transition-colors">{g.status === "Published" ? <X size={14} /> : <Check size={14} />}</button>
                      <button onClick={() => remove(g.id)} title="Delete" className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersAndComments({ users, setUsers, comments, setComments, role }) {
  const [tab, setTab] = useState("users");
  const isSuperAdmin = role === "super_admin";

  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "Active" ? "Flagged" : "Active";
    setUsers(users.map(u => u.id === id ? { ...u, status: newStatus } : u));
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", id);
    if (error) setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus } : u));
  };

  const removeComment = async (id) => {
    const prev = comments;
    setComments(comments.filter(c => c.id !== id));
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) setComments(prev);
  };

  const toggleComment = async (id, currentStatus) => {
    const newStatus = currentStatus === "Visible" ? "Flagged" : "Visible";
    setComments(comments.map(c => c.id === id ? { ...c, status: newStatus } : c));
    const { error } = await supabase.from("comments").update({ status: newStatus }).eq("id", id);
    if (error) setComments(comments.map(c => c.id === id ? { ...c, status: currentStatus } : c));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-zinc-50 mb-1" style={{ fontFamily: "'Fraunces', serif" }}>Users &amp; Comments</h2>
      <p className="text-sm text-zinc-500 mb-5">Manage community members and moderate discussion</p>

      <div className="flex gap-1 mb-5 bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        <button onClick={() => setTab("users")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "users" ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Users</button>
        <button onClick={() => setTab("comments")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "comments" ? "bg-amber-500/10 text-amber-400" : "text-zinc-500 hover:text-zinc-300"}`}>Comments</button>
      </div>

      {tab === "users" ? (
        users.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-sm text-zinc-500">
            No registered users yet.
          </div>
        ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-zinc-500 text-xs font-mono uppercase tracking-wider">
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
                  <td className="px-5 py-3.5 text-zinc-200 font-medium">{u.email}</td>
                  <td className="px-5 py-3.5 text-zinc-400">{u.role}</td>
                  <td className="px-5 py-3.5 text-zinc-500 font-mono text-xs">{u.created_at ? u.created_at.slice(0, 10) : ""}</td>
                  <td className="px-5 py-3.5"><StatusPill status={u.status === "active" ? "Active" : "Flagged"} /></td>
                  <td className="px-5 py-3.5">
                    {isSuperAdmin ? (
                      <button onClick={() => toggleUserStatus(u.id, u.status === "active" ? "Active" : "Flagged")} className="text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                        {u.status === "active" ? "Flag" : "Unflag"}
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
        )
      ) : (
        comments.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-sm text-zinc-500">
            No comments yet.
          </div>
        ) : (
        <div className="space-y-3">
          {comments.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium text-zinc-200">{c.user_email || "User"}</span>
                  <StatusPill status={c.status} />
                </div>
                <p className="text-sm text-zinc-400">{c.text}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleComment(c.id, c.status)} className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors" title="Toggle visibility">
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
        )
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
    onLogin(profile.role, authData.user.email);
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
function Dashboard_Shell({ onLogout, role, userEmail }) {
  const [page, setPage] = useState("dashboard");
  const [content, setContent] = useState([]);
  const [gist, setGist] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setLoadError("");
    const [contentRes, gistRes, usersRes, commentsRes] = await Promise.all([
      supabase.from("content").select("*").order("created_at", { ascending: false }),
      supabase.from("gist_articles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("comments").select("*").order("created_at", { ascending: false }),
    ]);

    const firstError = contentRes.error || gistRes.error || usersRes.error || commentsRes.error;
    if (firstError) {
      setLoadError("Couldn't load dashboard data: " + firstError.message);
      setLoading(false);
      return;
    }

    setContent(contentRes.data || []);
    setGist(gistRes.data || []);
    setUsers(usersRes.data || []);
    setComments(commentsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const flaggedCount = comments.filter(c => c.status === "Flagged").length + users.filter(u => u.status === "Flagged" || u.status === "flagged").length;

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
            <div className="text-sm text-zinc-200 font-medium truncate">{role === "super_admin" ? "Super Admin" : "Admin"}</div>
            <div className="text-xs text-zinc-500 truncate">{userEmail}</div>
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
          {loading && <LoadingBlock label="Loading dashboard..." />}
          {!loading && loadError && <ErrorBlock message={loadError} onRetry={loadAll} />}
          {!loading && !loadError && (
            <>
              {page === "dashboard" && <Dashboard content={content} gist={gist} users={users} comments={comments} />}
              {page === "content" && <ContentTable content={content} setContent={setContent} />}
              {page === "gist" && <GistManager gist={gist} setGist={setGist} />}
              {page === "users" && <UsersAndComments users={users} setUsers={setUsers} comments={comments} setComments={setComments} role={role} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setRole(null);
    setUserEmail("");
  };

  if (!loggedIn) {
    return (
      <LoginScreen
        onLogin={(userRole, email) => {
          setRole(userRole);
          setUserEmail(email);
          setLoggedIn(true);
        }}
      />
    );
  }
  return <Dashboard_Shell onLogout={handleLogout} role={role} userEmail={userEmail} />;
}
