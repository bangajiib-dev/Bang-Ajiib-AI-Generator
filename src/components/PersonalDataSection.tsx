import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Copy, Check, Lock, Code2, BookOpen, Eye, EyeOff } from 'lucide-react';
import {
  DEFAULT_SYSTEM_MENUS,
  canUserAccessMenu,
  isTrialAiGeneratorMenu,
  isMateriSystemMenu,
  type UserRecord,
  type SystemMenuItem,
} from '../constants/config.ts';

interface PersonalDataSectionProps {
  profile: UserRecord;
  menus?: SystemMenuItem[];
  onMasukSystemClick?: (menu: SystemMenuItem) => void;
  onEditTrialHtml?: () => void;
}

export const PersonalDataSection: React.FC<PersonalDataSectionProps> = ({
  profile,
  menus = DEFAULT_SYSTEM_MENUS,
  onMasukSystemClick,
  onEditTrialHtml,
}) => {
  const [copied, setCopied] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopyPassword = async () => {
    const pwd = profile.password || '';
    if (!pwd || pwd === '-') return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = pwd;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasLockedMenu = menus.some((menu) => !canUserAccessMenu(profile, menu.id, menus));

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900">Data Pribadi Pengguna</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <div className="text-slate-500">Nama Lengkap</div>
          <div className="font-semibold text-slate-900 mt-0.5">{profile.name}</div>
        </div>

        <div>
          <div className="text-slate-500">Email Terdaftar</div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-slate-900 break-all">
              {showEmail ? profile.email : '••••••••••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowEmail((prev) => !prev)}
              title={showEmail ? 'Sembunyikan Email' : 'Tampilkan Email'}
              className="px-2 py-1 text-[11px] font-semibold rounded-md border bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              {showEmail ? (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" />
                  <span>Tampilkan</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div>
          <div className="text-slate-500">Password</div>
          <div className="mt-0.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-slate-900 break-all">
              {!profile.password || profile.password === '-'
                ? '-'
                : showPassword
                  ? profile.password
                  : '••••••••••••'}
            </span>
            {profile.password && profile.password !== '-' && (
              <div className="inline-flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
                  className="px-2 py-1 text-[11px] font-semibold rounded-md border bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Tampilkan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPassword}
                  title="Salin Password"
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Tombol Aksi Menu Dinamis sesuai Persetujuan Admin */}
      <div className="pt-4 border-t border-slate-100 space-y-2.5">
        <div className="flex flex-col sm:flex-row flex-wrap justify-start sm:justify-end gap-3">
          {menus.length === 0 ? (
            <div className="text-xs text-slate-400 italic">
              Belum ada menu aksi yang tersedia.
            </div>
          ) : (
            menus.map((menu, index) => {
              const isAllowed = canUserAccessMenu(profile, menu.id, menus);
              const isTrialHtml = isTrialAiGeneratorMenu(menu);
              const isMateri = isMateriSystemMenu(menu);
              const isInternalView = isTrialHtml || isMateri;
              const isPrimaryStyle =
                menu.id === 'ai_generator' ||
                isTrialHtml ||
                isMateri ||
                (index % 2 === 1 && menu.id !== 'fashion');

              if (isAllowed) {
                return (
                  <div
                    key={menu.id}
                    className="w-full sm:w-auto flex items-stretch gap-1.5"
                  >
                    <motion.a
                      href={menu.url}
                      target={isInternalView ? undefined : '_blank'}
                      rel={isInternalView ? undefined : 'noopener noreferrer'}
                      onClick={(e) => {
                        if (isInternalView) {
                          e.preventDefault();
                        }
                        onMasukSystemClick?.(menu);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className={`flex-1 sm:flex-initial min-h-[44px] px-6 py-2.5 text-white font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
                        isMateri
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : isTrialHtml
                            ? 'bg-violet-600 hover:bg-violet-700'
                            : isPrimaryStyle
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {isMateri && <BookOpen className="w-4 h-4 shrink-0" />}
                      <span>{menu.name}</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </motion.a>

                    {isTrialHtml && onEditTrialHtml && (
                      <button
                        type="button"
                        onClick={onEditTrialHtml}
                        title="Edit Kode HTML Trial AI Generator"
                        className="min-h-[44px] px-3.5 py-2.5 text-xs font-semibold text-violet-700 hover:text-white bg-violet-50 hover:bg-violet-600 border border-violet-200 hover:border-violet-600 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                      >
                        <Code2 className="w-4 h-4 shrink-0" />
                        <span>Edit HTML</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={menu.id}
                  type="button"
                  disabled
                  title={`Akses menu ${menu.name} membutuhkan persetujuan Admin`}
                  className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 whitespace-nowrap cursor-not-allowed select-none"
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>{menu.name}</span>
                </button>
              );
            })
          )}
        </div>

        {hasLockedMenu && (
          <div className="text-[11px] text-slate-500 text-right flex items-center justify-end gap-1.5">
            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              Menu yang terkunci membutuhkan persetujuan dari Admin untuk dapat diakses.
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
