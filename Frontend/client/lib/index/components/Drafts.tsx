/**
 * Drafts — lists all saved draft registrations for the logged-in user's hospital.
 * Users can search, continue editing, or discard drafts.
 */
import { useCallback, useEffect, useState } from "react";
import { FileEdit, Search, Trash2, Loader2 } from "lucide-react";
import { draftApi, type ApiDraftListItem } from "@/lib/api";

type DraftsProps = {
  setView: (v: string) => void;
  /** Navigate to the registration form with a draft ID. */
  onContinueDraft: (draftId: number) => void;
};

export function Drafts({ setView, onContinueDraft }: DraftsProps) {
  const [drafts, setDrafts] = useState<ApiDraftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);

  const loadDrafts = useCallback(async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await draftApi.list(q);
      setDrafts(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drafts");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  const handleSearch = () => {
    setSearching(true);
    void loadDrafts(search.trim() || undefined);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearSearch = () => {
    setSearch("");
    void loadDrafts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to discard this draft?")) return;
    setDeletingId(id);
    try {
      await draftApi.delete(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete draft");
    } finally {
      setDeletingId(null);
    }
  };

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-[25px] font-extrabold tracking-tight text-[#103e54]">
            Drafts
          </h2>
          <p className="mt-1 text-sm text-[#82979e]">
            Continue editing incomplete patient registrations.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#96aab0]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by patient name or Aadhaar…"
            className="h-10 w-full rounded-xl border border-[#dce9eb] bg-white pl-9 pr-3 text-xs text-[#244c5b] outline-none transition placeholder:text-[#afc0c4] focus:border-[#36a99c]"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-[#0b7d87] px-4 text-xs font-bold text-white transition hover:bg-[#096a73] disabled:opacity-60"
        >
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          Search
        </button>
        {search && (
          <button
            onClick={handleClearSearch}
            className="flex h-10 items-center rounded-xl border border-[#dce9eb] bg-white px-3 text-xs font-bold text-[#6d858e] transition hover:bg-[#f0f4f5]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#087888]" />
          <span className="ml-3 text-sm text-[#82979e]">Loading drafts…</span>
        </div>
      ) : error ? (
        <div className="rounded-xl bg-[#fde8e8] p-4 text-sm text-[#d04a4a]">
          {error}
        </div>
      ) : drafts.length === 0 ? (
        <div className="rounded-2xl border border-[#e3edef] bg-white p-10 text-center">
          <FileEdit size={32} className="mx-auto mb-3 text-[#c9dce0]" />
          <p className="text-sm font-bold text-[#6d858e]">
            {search ? "No drafts match your search" : "No drafts yet"}
          </p>
          <p className="mt-1 text-xs text-[#96aab0]">
            {search
              ? "Try a different search term."
              : 'Start a new registration and click "Save Draft" to save your progress.'}
          </p>
          {!search && (
            <button
              onClick={() => setView("register")}
              className="mt-4 rounded-xl bg-[#0b7d87] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#096a73]"
            >
              New Registration
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-[#e3edef] bg-white shadow-[0_5px_20px_rgba(25,73,89,.035)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#edf3f4] text-left">
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Patient Name
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Aadhaar
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Step
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Last Updated
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Saved By
                </th>
                <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-[#8ba0a6]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-[#edf3f4] transition hover:bg-[#f8fbfb]"
                >
                  <td className="px-5 py-4 text-xs font-bold text-[#103e54]">
                    {d.patientName || (
                      <span className="italic text-[#96aab0]">Unnamed</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#52707b]">
                    {d.aadhaar || "—"}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#52707b]">
                    Step {d.currentStep} of 3
                  </td>
                  <td className="px-5 py-4 text-xs text-[#82979e]">
                    {formatRelative(d.updatedAt)}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#52707b]">
                    {d.createdByUser.fullName}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onContinueDraft(d.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#e8f5f5] px-3 py-1.5 text-[11px] font-bold text-[#087888] transition hover:bg-[#d4eded]"
                      >
                        <FileEdit size={12} /> Continue
                      </button>
                      <button
                        onClick={() => void handleDelete(d.id)}
                        disabled={deletingId === d.id}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold text-[#9aafb5] transition hover:bg-[#fde8e8] hover:text-[#d04a4a] disabled:opacity-50"
                      >
                        {deletingId === d.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete
                      </button>
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
