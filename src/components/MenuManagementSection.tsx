import React, { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Code2,
  BookOpen,
} from 'lucide-react';
import {
  isTrialAiGeneratorMenu,
  isMateriSystemMenu,
  type SystemMenuItem,
} from '../constants/config.ts';

interface MenuManagementSectionProps {
  menus: SystemMenuItem[];
  onCreateMenu: (payload: { name: string; url: string }) => Promise<void>;
  onUpdateMenu: (payload: { id: string; name: string; url: string }) => Promise<void>;
  onDeleteMenu: (id: string) => Promise<void>;
  onOpenMenu?: (menu: SystemMenuItem) => void;
  onEditTrialHtml?: () => void;
}

export const MenuManagementSection: React.FC<MenuManagementSectionProps> = ({
  menus,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onOpenMenu,
  onEditTrialHtml,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMenuForm, setNewMenuForm] = useState({ name: '', url: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', url: '' });
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setIsCreating(true);
    try {
      await onCreateMenu({
        name: newMenuForm.name.trim(),
        url: newMenuForm.url.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Menu "${newMenuForm.name.trim()}" berhasil ditambahkan dan disinkronkan.`,
      });
      setNewMenuForm({ name: '', url: '' });
      setShowAddForm(false);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menambahkan menu baru.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (menu: SystemMenuItem) => {
    setFeedback(null);
    setEditingId(menu.id);
    setEditForm({ name: menu.name, url: menu.url });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', url: '' });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.name.trim() || !editForm.url.trim()) {
      setFeedback({
        type: 'error',
        message: 'Nama menu dan link URL tidak boleh kosong.',
      });
      return;
    }
    setFeedback(null);
    setSavingEditId(id);
    try {
      await onUpdateMenu({
        id,
        name: editForm.name.trim(),
        url: editForm.url.trim(),
      });
      setFeedback({
        type: 'success',
        message: `Perubahan pada menu "${editForm.name.trim()}" berhasil disimpan.`,
      });
      setEditingId(null);
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui data menu.',
      });
    } finally {
      setSavingEditId(null);
    }
  };

  const handleDelete = async (menu: SystemMenuItem) => {
    setFeedback(null);
    setDeletingId(menu.id);
    try {
      await onDeleteMenu(menu.id);
      setFeedback({
        type: 'success',
        message: `Menu "${menu.name}" berhasil dihapus.`,
      });
      if (editingId === menu.id) {
        setEditingId(null);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus menu.',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Manajemen Menu &amp; Link Aksi (Khusus Admin)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tambah menu baru, ubah nama atau link menu yang sudah ada, dan hapus menu secara langsung.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setShowAddForm((prev) => !prev);
          }}
          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Tutup Form' : 'Tambah Menu'}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Nama Menu *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Fashion / AI Generator / Materi"
                value={newMenuForm.name}
                onChange={(e) => setNewMenuForm({ ...newMenuForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Link / URL Tujuan *
              </label>
              <input
                type="text"
                required
                placeholder="https://share.gemini.google/..."
                value={newMenuForm.url}
                onChange={(e) => setNewMenuForm({ ...newMenuForm, url: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Menu</span>
              )}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500">
              <th className="py-2.5 pr-4 w-1/4">Nama Menu</th>
              <th className="py-2.5 px-4">Link / URL Tujuan</th>
              <th className="py-2.5 pl-4 text-right w-48">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {menus.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-slate-400 italic">
                  Belum ada data menu. Klik &ldquo;Tambah Menu&rdquo; untuk menambahkan menu baru.
                </td>
              </tr>
            ) : (
              menus.map((menu) => {
                const isEditing = editingId === menu.id;
                const isSaving = savingEditId === menu.id;
                const isDeleting = deletingId === menu.id;
                const isInternalMenu =
                  isTrialAiGeneratorMenu(menu) || isMateriSystemMenu(menu);

                return (
                  <tr key={menu.id}>
                    <td className="py-3 pr-4 align-middle">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm({ ...editForm, name: e.target.value })
                          }
                          placeholder="Nama menu"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-500 rounded-md text-slate-900 font-semibold focus:outline-none"
                        />
                      ) : (
                        <span className="font-semibold text-slate-900">{menu.name}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 align-middle">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.url}
                          onChange={(e) =>
                            setEditForm({ ...editForm, url: e.target.value })
                          }
                          placeholder="https://..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-blue-500 rounded-md text-slate-900 font-mono focus:outline-none"
                        />
                      ) : (
                        <a
                          href={menu.url}
                          target={isInternalMenu ? undefined : '_blank'}
                          rel={isInternalMenu ? undefined : 'noopener noreferrer'}
                          onClick={(e) => {
                            if (isInternalMenu && onOpenMenu) {
                              e.preventDefault();
                              onOpenMenu(menu);
                            }
                          }}
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 break-all cursor-pointer"
                        >
                          <span>{menu.url}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </td>

                    <td className="py-3 pl-4 text-right align-middle">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleSaveEdit(menu.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            >
                              {isSaving ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                            </button>

                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Batal</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {isMateriSystemMenu(menu) && onOpenMenu && (
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => onOpenMenu(menu)}
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Kelola Materi</span>
                              </button>
                            )}

                            {isTrialAiGeneratorMenu(menu) && onEditTrialHtml && (
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={onEditTrialHtml}
                                className="px-2.5 py-1 text-xs font-semibold text-violet-700 hover:text-white bg-violet-50 hover:bg-violet-600 border border-violet-200 hover:border-violet-600 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                                <span>Edit HTML</span>
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleStartEdit(menu)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDelete(menu)}
                              className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
