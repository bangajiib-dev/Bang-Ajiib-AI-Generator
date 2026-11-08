import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  BookOpen,
  PlayCircle,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ExternalLink,
  Search,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Youtube,
} from 'lucide-react';
import {
  extractYoutubeVideoId,
  getYoutubeEmbedUrl,
  getYoutubeThumbnailUrl,
  getYoutubeWatchUrl,
  type MateriModuleItem,
  type MateriVideoItem,
  type UserRole,
} from '../constants/config.ts';

interface MateriDashboardViewProps {
  modules: MateriModuleItem[];
  role: UserRole;
  userEmail: string;
  userName: string;
  onBack: () => void;
  onSaveModules: (updatedModules: MateriModuleItem[], actionLabel: string) => Promise<void>;
}

interface VideoFormInput {
  id: string;
  title: string;
  youtubeUrl: string;
  description: string;
}

const SUGGESTED_CATEGORIES = [
  'Panduan Dasar',
  'Strategi Affiliate',
  'Visual & Animasi',
  'Prompt Engineering',
  'Tutorial Praktik',
];

export const MateriDashboardView: React.FC<MateriDashboardViewProps> = ({
  modules,
  role,
  userEmail,
  userName,
  onBack,
  onSaveModules,
}) => {
  const isAdmin = role === 'admin';

  // Navigation state: null = Dashboard Materi (daftar menu pembelajaran), string = ID menu pembelajaran yang dibuka
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');

  // Delete confirmation state (inline, tanpa window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Admin Modal Form State (Tambah / Edit Menu Materi)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Panduan Dasar');
  const [formDescription, setFormDescription] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVideos, setFormVideos] = useState<VideoFormInput[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);

  const activeModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || null,
    [modules, selectedModuleId]
  );

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(modules.map((m) => m.category.trim()).filter(Boolean))
    );
    return ['Semua', ...unique];
  }, [modules]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesCategory =
        selectedCategory === 'Semua' ||
        m.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const inTitle = m.title.toLowerCase().includes(q);
      const inCategory = m.category.toLowerCase().includes(q);
      const inDesc = m.description.toLowerCase().includes(q);
      const inContent = m.content.toLowerCase().includes(q);
      const inVideos = m.videos.some((v) => v.title.toLowerCase().includes(q));
      return inTitle || inCategory || inDesc || inContent || inVideos;
    });
  }, [modules, selectedCategory, searchQuery]);

  const totalYoutubeVideos = useMemo(
    () => modules.reduce((acc, m) => acc + m.videos.length, 0),
    [modules]
  );

  const handleOpenModule = (moduleItem: MateriModuleItem) => {
    setSelectedModuleId(moduleItem.id);
    setActiveVideoIndex(0);
    setConfirmDeleteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreateModal = () => {
    setEditingModuleId(null);
    setFormTitle('');
    setFormCategory('Panduan Dasar');
    setFormDescription('');
    setFormContent('');
    setFormVideos([
      {
        id: `vid_${Date.now().toString(36)}_1`,
        title: '',
        youtubeUrl: '',
        description: '',
      },
    ]);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (moduleItem: MateriModuleItem, appendEmptyVideo = false) => {
    setEditingModuleId(moduleItem.id);
    setFormTitle(moduleItem.title);
    setFormCategory(moduleItem.category || 'Panduan Dasar');
    setFormDescription(moduleItem.description || '');
    setFormContent(moduleItem.content || '');

    const existingVideos: VideoFormInput[] = moduleItem.videos.map((v) => ({
      id: v.id,
      title: v.title,
      youtubeUrl: v.youtubeUrl,
      description: v.description || '',
    }));

    if (appendEmptyVideo || existingVideos.length === 0) {
      existingVideos.push({
        id: `vid_${Date.now().toString(36)}_${existingVideos.length + 1}`,
        title: '',
        youtubeUrl: '',
        description: '',
      });
    }

    setFormVideos(existingVideos);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleAddVideoField = () => {
    setFormVideos((prev) => [
      ...prev,
      {
        id: `vid_${Date.now().toString(36)}_${prev.length + 1}`,
        title: '',
        youtubeUrl: '',
        description: '',
      },
    ]);
  };

  const handleRemoveVideoField = (id: string) => {
    setFormVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const handleMoveVideoField = (index: number, direction: 'up' | 'down') => {
    setFormVideos((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleVideoFieldChange = (
    id: string,
    field: keyof VideoFormInput,
    value: string
  ) => {
    setFormVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanTitle = formTitle.trim();
    const cleanCategory = formCategory.trim() || 'Materi Umum';
    const cleanDescription = formDescription.trim();
    const cleanContent = formContent.trim();

    if (!cleanTitle) {
      setFormError('Nama / Judul Menu Materi wajib diisi.');
      return;
    }

    if (!cleanContent) {
      setFormError('Isi Materi Pembelajaran wajib diisi.');
      return;
    }

    // Filter baris video yang diisi URL-nya
    const nonEmptyVideos = formVideos.filter(
      (v) => v.youtubeUrl.trim() !== '' || v.title.trim() !== ''
    );

    for (let i = 0; i < nonEmptyVideos.length; i++) {
      const v = nonEmptyVideos[i];
      if (!v.youtubeUrl.trim()) {
        setFormError(`Link YouTube pada Video #${i + 1} wajib diisi.`);
        return;
      }
      const ytId = extractYoutubeVideoId(v.youtubeUrl);
      if (!ytId) {
        setFormError(
          `Link YouTube pada Video #${i + 1} ("${v.youtubeUrl}") tidak valid. Gunakan link youtube.com/watch?v=... atau youtu.be/...`
        );
        return;
      }
    }

    const preparedVideos: MateriVideoItem[] = nonEmptyVideos.map((v, idx) => ({
      id: v.id || `vid_${Date.now().toString(36)}_${idx + 1}`,
      title: v.title.trim() || `Video Pembelajaran ${idx + 1}`,
      youtubeUrl: v.youtubeUrl.trim(),
      ...(v.description.trim() ? { description: v.description.trim() } : {}),
    }));

    const now = new Date().toISOString();
    let updatedList: MateriModuleItem[];
    let actionLabel: string;

    if (editingModuleId) {
      updatedList = modules.map((m) =>
        m.id === editingModuleId
          ? {
              ...m,
              title: cleanTitle,
              category: cleanCategory,
              description:
                cleanDescription ||
                cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : ''),
              content: cleanContent,
              videos: preparedVideos,
              updatedAt: now,
            }
          : m
      );
      actionLabel = `Update Materi: ${cleanTitle}`;
    } else {
      const slug = cleanTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 24);
      const newModule: MateriModuleItem = {
        id: `materi_${slug || 'modul'}_${Date.now().toString(36).slice(-4)}`,
        title: cleanTitle,
        category: cleanCategory,
        description:
          cleanDescription ||
          cleanContent.slice(0, 140) + (cleanContent.length > 140 ? '...' : ''),
        content: cleanContent,
        videos: preparedVideos,
        updatedAt: now,
      };
      updatedList = [...modules, newModule];
      actionLabel = `Create Materi: ${cleanTitle}`;
    }

    setIsSavingForm(true);
    try {
      await onSaveModules(updatedList, actionLabel);
      setFeedback({
        type: 'success',
        message: editingModuleId
          ? `Menu materi "${cleanTitle}" berhasil diperbarui dan disinkronkan.`
          : `Menu materi baru "${cleanTitle}" berhasil ditambahkan ke Dashboard Materi.`,
      });
      setIsFormModalOpen(false);
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan menu materi.'
      );
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleConfirmDeleteModule = async (moduleItem: MateriModuleItem) => {
    setIsDeleting(true);
    setFeedback(null);
    try {
      const updatedList = modules.filter((m) => m.id !== moduleItem.id);
      await onSaveModules(updatedList, `Delete Materi: ${moduleItem.title}`);
      setFeedback({
        type: 'success',
        message: `Menu materi "${moduleItem.title}" berhasil dihapus.`,
      });
      setConfirmDeleteId(null);
      if (selectedModuleId === moduleItem.id) {
        setSelectedModuleId(null);
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Gagal menghapus menu materi.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const currentModuleIndex = activeModule
    ? modules.findIndex((m) => m.id === activeModule.id)
    : -1;
  const prevModule =
    currentModuleIndex > 0 ? modules[currentModuleIndex - 1] : null;
  const nextModule =
    currentModuleIndex >= 0 && currentModuleIndex < modules.length - 1
      ? modules[currentModuleIndex + 1]
      : null;

  const activeVideo: MateriVideoItem | null =
    activeModule && activeModule.videos.length > 0
      ? activeModule.videos[activeVideoIndex] || activeModule.videos[0]
      : null;

  const activeVideoEmbedUrl = activeVideo
    ? getYoutubeEmbedUrl(activeVideo.youtubeUrl)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Sticky Navigation Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Dashboard Materi Pembelajaran
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  Portal Edukasi &amp; Video YouTube — Bang Ajiib System
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-[11px] font-bold uppercase text-emerald-700">
              {role}
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Menu Materi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {feedback && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {!activeModule ? (
          /* =====================================================================
           * TAMPILAN 1: DASHBOARD MATERI & DAFTAR MENU PEMBELAJARAN
           * ===================================================================== */
          <>
            {/* Hero / Overview Banner */}
            <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Menu Materi Pembelajaran Terverifikasi</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Halo, {userName} — Pilih Menu Pembelajaran Anda
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Pilih salah satu menu pembelajaran di bawah ini untuk mempelajari materi tertulis
                    dan menonton rangkaian video panduan dari YouTube secara langsung.
                  </p>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-3 sm:w-auto shrink-0">
                  <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3.5 min-w-[140px]">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Menu Materi</span>
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                      {modules.length}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Modul tersedia
                    </div>
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3.5 min-w-[140px]">
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                      <Youtube className="w-3.5 h-3.5 text-red-400" />
                      <span>Video YouTube</span>
                    </div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
                      {totalYoutubeVideos}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Siap ditonton
                    </div>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400">Mode Admin Aktif:</span> Anda
                    dapat menambahkan menu pembelajaran baru, mengedit materi &amp; link video YouTube,
                    atau menghapus menu kapan saja.
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Menu Pembelajaran Baru</span>
                  </button>
                </div>
              )}
            </section>

            {/* Filter & Search Bar */}
            <section className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari menu materi atau judul video..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-emerald-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </section>

            {/* Daftar Menu Pembelajaran Grid */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">
                  Daftar Menu Pembelajaran Tersedia ({filteredModules.length})
                </h2>
              </div>

              {filteredModules.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-800">
                      Belum Ada Menu Materi yang Ditemukan
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {searchQuery || selectedCategory !== 'Semua'
                        ? 'Coba ubah kata kunci pencarian atau pilih kategori "Semua".'
                        : 'Belum ada menu materi pembelajaran yang ditambahkan.'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenCreateModal}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Menu Materi Pertama</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredModules.map((moduleItem, index) => {
                    const firstVideo = moduleItem.videos[0];
                    const thumbnailUrl = firstVideo
                      ? getYoutubeThumbnailUrl(firstVideo.youtubeUrl)
                      : null;
                    const isConfirmingDelete = confirmDeleteId === moduleItem.id;

                    return (
                      <div
                        key={moduleItem.id}
                        className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden flex flex-col transition-all shadow-2xs hover:shadow-md"
                      >
                        {/* Thumbnail / Visual Header */}
                        <div
                          onClick={() => handleOpenModule(moduleItem)}
                          className="relative h-44 bg-slate-900 overflow-hidden cursor-pointer group"
                        >
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={moduleItem.title}
                              className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-emerald-400/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                              {moduleItem.category}
                            </span>
                            <span className="px-2.5 py-1 rounded-md bg-slate-900/80 backdrop-blur-xs text-[11px] font-semibold text-white inline-flex items-center gap-1">
                              <Video className="w-3 h-3 text-red-400" />
                              <span>{moduleItem.videos.length} Video</span>
                            </span>
                          </div>

                          {/* Bottom Play Hint */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                            <span className="text-[11px] font-mono text-slate-300">
                              Menu #{index + 1}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 group-hover:translate-x-0.5 transition-transform">
                              <PlayCircle className="w-4 h-4" />
                              <span>Buka Materi</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h3
                              onClick={() => handleOpenModule(moduleItem)}
                              className="text-base font-bold text-slate-900 hover:text-emerald-700 cursor-pointer line-clamp-2 leading-snug"
                            >
                              {moduleItem.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                              {moduleItem.description || moduleItem.content}
                            </p>

                            {/* Preview Daftar Video di dalam Menu */}
                            {moduleItem.videos.length > 0 && (
                              <div className="pt-2 space-y-1">
                                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                                  <span>Daftar Video YouTube:</span>
                                </div>
                                <ul className="space-y-1">
                                  {moduleItem.videos.slice(0, 2).map((v, vIdx) => (
                                    <li
                                      key={v.id}
                                      className="text-[11px] text-slate-600 truncate flex items-center gap-1.5"
                                    >
                                      <span className="w-4 h-4 rounded bg-slate-100 text-slate-700 font-mono text-[10px] inline-flex items-center justify-center shrink-0">
                                        {vIdx + 1}
                                      </span>
                                      <span className="truncate">{v.title}</span>
                                    </li>
                                  ))}
                                  {moduleItem.videos.length > 2 && (
                                    <li className="text-[11px] text-emerald-700 font-medium pl-5">
                                      +{moduleItem.videos.length - 2} video lainnya
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <button
                              type="button"
                              onClick={() => handleOpenModule(moduleItem)}
                              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Pelajari Materi &amp; Tonton Video</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Aksi Admin: Edit & Hapus Menu Materi */}
                            {isAdmin && (
                              <div className="pt-1">
                                {isConfirmingDelete ? (
                                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-semibold text-red-800">
                                      Hapus menu ini?
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => handleConfirmDeleteModule(moduleItem)}
                                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded cursor-pointer disabled:opacity-50"
                                      >
                                        {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => setConfirmDeleteId(null)}
                                        className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded cursor-pointer"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(moduleItem)}
                                      className="flex-1 py-1.5 px-2.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>Edit Menu</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(moduleItem.id)}
                                      className="py-1.5 px-3 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        ) : (
          /* =====================================================================
           * TAMPILAN 2: DI DALAM MENU PEMBELAJARAN (MATERI + VIDEO YOUTUBE)
           * ===================================================================== */
          <div className="space-y-6">
            {/* Top Bar Inside Module */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedModuleId(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-800 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Daftar Menu Materi</span>
              </button>

              {isAdmin && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeModule, true)}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Video YouTube</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(activeModule)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Materi &amp; Video</span>
                  </button>

                  {confirmDeleteId === activeModule.id ? (
                    <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                      <span className="text-xs font-semibold text-red-800">Hapus menu?</span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleConfirmDeleteModule(activeModule)}
                        className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 rounded cursor-pointer"
                      >
                        Ya
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-0.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(activeModule.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Menu</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Judul & Ringkasan Menu Pembelajaran */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {activeModule.category}
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">
                  {activeModule.videos.length} Video YouTube
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {activeModule.title}
              </h1>
              {activeModule.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {activeModule.description}
                </p>
              )}
            </section>

            {/* Bagian Video Pembelajaran YouTube */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Youtube className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Video Pembelajaran YouTube ({activeModule.videos.length} Video)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Putar video langsung di bawah ini atau pilih dari daftar video yang tersedia
                    </p>
                  </div>
                </div>

                {activeVideo && (
                  <a
                    href={getYoutubeWatchUrl(activeVideo.youtubeUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Buka di YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {activeModule.videos.length === 0 ? (
                <div className="p-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                  <Video className="w-8 h-8 text-slate-400 mx-auto" />
                  <div className="text-xs font-semibold text-slate-700">
                    Belum ada video YouTube pada menu materi ini.
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(activeModule, true)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambahkan Video YouTube Sekarang</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {/* Pemutar Video Utama (2 Kolom pada Layar Besar) */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-sm">
                      {activeVideoEmbedUrl ? (
                        <iframe
                          key={activeVideoEmbedUrl}
                          src={activeVideoEmbedUrl}
                          title={activeVideo?.title || 'Video Pembelajaran YouTube'}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                          <AlertCircle className="w-8 h-8 text-amber-400" />
                          <p className="text-xs">
                            Video tidak dapat di-embed secara langsung. Silakan klik tombol
                            &ldquo;Buka di YouTube&rdquo; di atas.
                          </p>
                        </div>
                      )}
                    </div>

                    {activeVideo && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="text-[11px] font-mono font-semibold text-emerald-700">
                          Sedang Diputar · Video {activeVideoIndex + 1} dari{' '}
                          {activeModule.videos.length}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {activeVideo.title}
                        </h3>
                        {activeVideo.description && (
                          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                            {activeVideo.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Daftar Playlist Video di Menu Ini */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>Daftar Video di Menu Ini</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {activeModule.videos.length} Video
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {activeModule.videos.map((vid, idx) => {
                        const isCurrent = idx === activeVideoIndex;
                        const thumb = getYoutubeThumbnailUrl(vid.youtubeUrl);

                        return (
                          <button
                            key={vid.id}
                            type="button"
                            onClick={() => setActiveVideoIndex(idx)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-50/90 border-emerald-500 ring-1 ring-emerald-500/30'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="relative w-24 aspect-video rounded-lg bg-slate-900 overflow-hidden shrink-0">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={vid.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PlayCircle className="w-5 h-5 text-white/70" />
                                </div>
                              )}
                              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-white">
                                #{idx + 1}
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div
                                className={`text-xs font-bold line-clamp-2 leading-snug ${
                                  isCurrent ? 'text-emerald-950' : 'text-slate-900'
                                }`}
                              >
                                {vid.title}
                              </div>
                              {vid.description && (
                                <p className="text-[11px] text-slate-500 line-clamp-1">
                                  {vid.description}
                                </p>
                              )}
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 pt-0.5">
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Sedang Diputar</span>
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Bagian Bacaan / Isi Materi Pembelajaran */}
            <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">
                      Penjelasan Materi &amp; Panduan Pembelajaran
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pelajari catatan materi di bawah ini secara berurutan
                    </p>
                  </div>
                </div>
              </div>

              <div
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="p-4 sm:p-6 bg-slate-50 border border-slate-200/80 rounded-xl text-sm text-slate-800 whitespace-pre-line leading-relaxed select-none"
              >
                {activeModule.content}
              </div>
            </section>

            {/* Navigasi Menu Materi Sebelumnya / Selanjutnya */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {prevModule ? (
                <button
                  type="button"
                  onClick={() => handleOpenModule(prevModule)}
                  className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Menu Sebelumnya</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {prevModule.title}
                    </div>
                  </div>
                </button>
              ) : (
                <div />
              )}

              {nextModule && (
                <button
                  type="button"
                  onClick={() => handleOpenModule(nextModule)}
                  className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-right flex items-center justify-end gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] text-slate-400">Menu Selanjutnya</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {nextModule.title}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
       * MODAL INPUT ADMIN: TAMBAH / EDIT MENU MATERI & VIDEO YOUTUBE
       * ===================================================================== */}
      {isAdmin && isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingModuleId
                      ? 'Edit Menu Pembelajaran & Video YouTube'
                      : 'Tambah Menu Pembelajaran Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Lengkapi judul menu, isi materi pembelajaran, dan daftar link video YouTube.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isSavingForm}
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-5 space-y-5"
            >
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Baris 1: Nama Menu Materi & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Nama / Judul Menu Pembelajaran *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Contoh: Modul 4: Cara Riset Konten & Pembuatan Prompt Video"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Kategori Menu *
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Contoh: Panduan Dasar"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {SUGGESTED_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded cursor-pointer"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Baris 2: Deskripsi Singkat */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Ringkasan / Deskripsi Singkat Menu
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ringkasan singkat mengenai apa yang akan dipelajari user di menu ini..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Baris 3: Isi Materi Pembelajaran Lengkap */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Isi Materi Pembelajaran Lengkap *
                </label>
                <textarea
                  required
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan penjelasan materi lengkap, langkah-langkah pembelajaran, contoh prompt, atau catatan penting untuk user..."
                  className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-600 leading-relaxed resize-y"
                />
              </div>

              {/* Baris 4: Input Daftar Video YouTube */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900">
                      Daftar Video Pembelajaran dari YouTube ({formVideos.length} Video)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Masukkan satu atau beberapa link video YouTube (mendukung link youtube.com/watch?v=..., youtu.be/..., atau YouTube Shorts).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddVideoField}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Video YouTube</span>
                  </button>
                </div>

                {formVideos.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-500">
                    Belum ada video yang ditambahkan. Klik &ldquo;Tambah Video YouTube&rdquo; untuk menyertakan video.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formVideos.map((videoItem, idx) => {
                      const detectedYtId = extractYoutubeVideoId(videoItem.youtubeUrl);
                      const previewThumb = getYoutubeThumbnailUrl(videoItem.youtubeUrl);

                      return (
                        <div
                          key={videoItem.id}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-md bg-red-100 text-red-700 font-mono text-[11px] inline-flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span>Video YouTube #{idx + 1}</span>
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveVideoField(idx, 'up')}
                                title="Pindah ke atas"
                                className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === formVideos.length - 1}
                                onClick={() => handleMoveVideoField(idx, 'down')}
                                title="Pindah ke bawah"
                                className="p-1 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded disabled:opacity-40 cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVideoField(videoItem.id)}
                                className="px-2 py-1 text-[11px] font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded inline-flex items-center gap-1 cursor-pointer ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Judul Video Pembelajaran
                              </label>
                              <input
                                type="text"
                                value={videoItem.title}
                                onChange={(e) =>
                                  handleVideoFieldChange(videoItem.id, 'title', e.target.value)
                                }
                                placeholder={`Contoh: Bagian ${idx + 1} - Praktik Langsung`}
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Link / URL Video YouTube *
                              </label>
                              <input
                                type="text"
                                value={videoItem.youtubeUrl}
                                onChange={(e) =>
                                  handleVideoFieldChange(
                                    videoItem.id,
                                    'youtubeUrl',
                                    e.target.value
                                  )
                                }
                                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:border-emerald-600"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 space-y-1">
                              <label className="block text-[11px] font-semibold text-slate-700">
                                Keterangan / Catatan Video (Opsional)
                              </label>
                              <input
                                type="text"
                                value={videoItem.description}
                                onChange={(e) =>
                                  handleVideoFieldChange(
                                    videoItem.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                                placeholder="Catatan singkat untuk video ini..."
                                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
                              />
                            </div>

                            {/* Live Preview Thumbnail YouTube */}
                            {videoItem.youtubeUrl.trim() && (
                              <div className="shrink-0 flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                                {detectedYtId && previewThumb ? (
                                  <>
                                    <img
                                      src={previewThumb}
                                      alt="Preview"
                                      className="w-14 h-9 object-cover rounded bg-slate-900"
                                    />
                                    <div className="text-[11px]">
                                      <div className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <Check className="w-3 h-3" />
                                        <span>Link Valid</span>
                                      </div>
                                      <div className="font-mono text-[10px] text-slate-500">
                                        ID: {detectedYtId}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-[11px] text-amber-700 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Format URL belum dikenali</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingForm}
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingForm}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSavingForm ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {editingModuleId ? 'Simpan Perubahan Materi' : 'Simpan Menu Materi'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
