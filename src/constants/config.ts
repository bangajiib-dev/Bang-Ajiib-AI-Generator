/**
 * Konfigurasi Permanen Database Spreadsheet, Apps Script, dan Tautan Sistem
 */

export const PERMANENT_LINKS = {
  SPREADSHEET_ID: '1_ImJ32kF3PfKdg9iTfO187a2Xbb8CzW36mJLdfS7QB0',
  SPREADSHEET_EDIT_URL:
    'https://docs.google.com/spreadsheets/d/1_ImJ32kF3PfKdg9iTfO187a2Xbb8CzW36mJLdfS7QB0/edit?usp=sharing',
  SPREADSHEET_GVIZ_URL:
    'https://docs.google.com/spreadsheets/d/1_ImJ32kF3PfKdg9iTfO187a2Xbb8CzW36mJLdfS7QB0/gviz/tq?tqx=out:json',
  SPREADSHEET_CSV_URL:
    'https://docs.google.com/spreadsheets/d/1_ImJ32kF3PfKdg9iTfO187a2Xbb8CzW36mJLdfS7QB0/export?format=csv',
  APPS_SCRIPT_EXEC_URL:
    'https://script.google.com/macros/s/AKfycbzFxIRgm2CYI1zON5exZgTwu0s5-2sBPU5GydQ1voJvscnpsrgS0OqvqtC5Vq82XMs3/exec',
  MASUK_SYSTEM_TARGET_URL: 'https://share.gemini.google/HpipBeEq7a5Z',
  FASHION_TARGET_URL: 'https://share.gemini.google/ygsvc4rCvQcg',
} as const;

export const UNREGISTERED_EMAIL_MESSAGE =
  'Email Anda Tidak Terdaftar, Harap Hubungi Owner Melalui Icon Whatsapp';

export type UserRole = 'admin' | 'user';

export type AccountStatus = 'Aktif & Terverifikasi' | 'Menunggu Verifikasi' | 'Dibekukan Sementara';

export interface MateriVideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  description?: string;
}

export interface MateriModuleItem {
  id: string;
  title: string;
  category: string;
  description: string;
  content: string;
  videos: MateriVideoItem[];
  updatedAt: string;
}

/**
 * Item Menu Aksi Dinamis yang dapat ditambah, diedit, dan dihapus oleh Admin
 */
export interface SystemMenuItem {
  id: string;
  name: string;
  url: string;
  customHtml?: string;
  materiModules?: MateriModuleItem[];
}

export const TRIAL_AI_GENERATOR_MENU: SystemMenuItem = {
  id: 'trial_ai_generator',
  name: 'Trial AI Generator',
  url: '/trial-ai-generator.html',
};

export const MATERI_SYSTEM_MENU: SystemMenuItem = {
  id: 'materi',
  name: 'Materi',
  url: '/materi',
};

export const DEFAULT_SYSTEM_MENUS: SystemMenuItem[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    url: PERMANENT_LINKS.FASHION_TARGET_URL,
  },
  {
    id: 'ai_generator',
    name: 'AI Generator',
    url: PERMANENT_LINKS.MASUK_SYSTEM_TARGET_URL,
  },
  TRIAL_AI_GENERATOR_MENU,
  MATERI_SYSTEM_MENU,
];

export const TRIAL_AI_GENERATOR_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="theme-color" content="#101827">
<title>AI Video Generator Builder By Bang Ajiib</title>
<style>
:root{--bg:#0b1220;--panel:#131e30;--panel2:#1b2940;--line:#30415e;--txt:#f4f7fb;--muted:#a9b8cc;--accent:#8b5cf6;--accent2:#22c55e}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(circle at top right,#29204c 0,#0b1220 43%);color:var(--txt);font:15px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif}
.wrap{max-width:1050px;margin:auto;padding:22px 15px 48px}
header{padding:10px 0 22px} .eyebrow{color:#c4b5fd;font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
h1{font-size:clamp(27px,5vw,42px);line-height:1.1;margin:8px 0}
.lead{color:var(--muted);max-width:760px}
.layout{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
.panel{background:#131e30f2;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 15px 40px #0003}
h2{font-size:18px;margin:0 0 12px}
label{display:block;font-weight:700;font-size:13px;margin:12px 0 5px;color:#dce6f5}
input,select,textarea{width:100%;border:1px solid #3a4c6b;background:#0b1526;color:var(--txt);border-radius:9px;padding:10px 11px;font:inherit}
textarea{min-height:70px;resize:vertical}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hint{font-size:12px;color:var(--muted);margin-top:5px}
button{border:0;border-radius:9px;padding:11px 14px;font-weight:800;cursor:pointer;font-size:14px}
.primary{background:linear-gradient(100deg,#8b5cf6,#6366f1);color:white}
.secondary{background:#263650;color:#eef4ff;border:1px solid #405271}
.green{background:#166534;color:#dcfce7}
.btns{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
.output{white-space:pre-wrap;background:#091322;border:1px solid #2d3d58;border-radius:10px;padding:13px;min-height:260px;color:#e7eefb;font-size:13px}
.note{background:#2b2414;border:1px solid #6b5120;color:#fde68a;padding:10px;border-radius:9px;font-size:12px;margin-top:12px}
footer{text-align:center;color:var(--muted);font-size:12px;margin-top:18px}
@media(max-width:780px){.layout{grid-template-columns:1fr}.grid{grid-template-columns:1fr 1fr}}
@media(max-width:420px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
<header>
<div class="eyebrow">Creative tool · AI video</div>
<h1>AI Video Generator Builder By Bang Ajiib</h1>
<p class="lead">Pilih opsi, isi detail penting, lalu buat brief siap kirim ke ChatGPT untuk menghasilkan storyboard serta judul, deskripsi, dan tepat 5 hashtag siap upload.</p>
</header>
<main class="layout">
<section class="panel">
<h2>1. Pilih konsep video</h2>
<form id="briefForm" novalidate>
<label>Judul / nama produk atau program</label>
<input id="title" placeholder="Contoh: AI Prompt Generator">
<div class="grid">
<div><label>Jenis konten</label><select id="type"><option>Promosi Produk</option><option>Affiliate Product Showcase</option><option>Promosi Program / Aplikasi AI</option><option>Edukasi</option><option>Personal Branding</option><option>Review Produk</option><option>Lainnya</option></select></div>
<div><label>Tujuan video</label><select id="goal"><option>Memperkenalkan</option><option>Menjual</option><option>Mengajak menggunakan</option><option>Meningkatkan branding</option><option>Mengedukasi</option></select></div>
<div><label>Platform</label><select id="platform"><option>TikTok</option><option>Instagram Reels</option><option>YouTube Shorts</option><option>Semua platform video pendek</option><option>YouTube</option></select></div>
<div><label>Target audiens</label><select id="audience"><option>Umum</option><option>Remaja</option><option>Pelajar dan mahasiswa</option><option>Kreator konten</option><option>Affiliate marketer</option><option>Pebisnis / UMKM</option><option>Pekerja profesional</option></select></div>
<div><label>Jumlah scene</label><select id="scenes"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option><option>8</option></select></div>
<div><label>Durasi per scene</label><select id="duration"><option>5 detik</option><option selected>10 detik</option><option>15 detik</option></select></div>
<div><label>Gaya visual</label><select id="visual"><option>Realistic 3D cinematic</option><option>Realistic human / live action</option><option>Futuristic AI technology</option><option>Animasi 3D</option><option>Commercial product cinematic</option><option>UGC / konten kreator natural</option><option>Anime</option></select></div>
<div><label>Gaya promosi</label><select id="promo"><option>Persuasif dan profesional</option><option>Dramatis dan emosional</option><option>Santai dan natural</option><option>Komedi dan menghibur</option><option>Enerjik dan viral</option><option>Mewah / premium</option></select></div>
<div><label>Jenis hook</label><select id="hook"><option>Hook mengejutkan</option><option>Pertanyaan yang memancing rasa penasaran</option><option>Masalah yang sering dialami</option><option>Fakta atau angka menarik</option><option>Before-after</option><option>Visual yang tidak terduga</option></select></div>
<div><label>Gaya voice over</label><select id="voice"><option>Natural dan komunikatif</option><option>Energik dan antusias</option><option>Profesional dan meyakinkan</option><option>Santai seperti teman</option><option>Dramatis dan emosional</option></select></div>
<div><label>AI video generator</label><select id="generator"><option>Fleksibel untuk berbagai AI video</option><option>Kling AI</option><option>Google Veo</option><option>Runway</option><option>Hailuo AI</option><option>Seedance</option><option>Lainnya</option></select></div>
<div><label>Rasio video</label><select id="ratio"><option>9:16 vertikal</option><option>16:9 horizontal</option><option>1:1 persegi</option></select></div>
</div>
<label>Gaya karakter</label><select id="character"><option>Gunakan karakter yang sama di semua scene</option><option>Tanpa karakter manusia, fokus produk</option><option>Karakter berbeda sesuai scene</option><option>Gunakan foto karakter referensi yang saya upload</option></select>
<label>Foto referensi</label><select id="reference"><option>Foto produk dan foto karakter</option><option>Foto produk saja</option><option>Foto karakter saja</option><option>Tanpa foto referensi</option><option>Akan saya jelaskan kemudian</option></select>
<label>Musik dan efek suara</label><select id="audio"><option>BGM dan SFX sesuai setiap scene</option><option>BGM saja</option><option>SFX saja</option><option>Tanpa audio</option></select>
<label>Detail CTA / ajakan</label>
<select id="cta">
<option>Klik keranjang kuning sekarang juga dan mulai rasakan bedanya hari ini</option>
<option>Jangan biarkan kesempatan ini lewat, coba sekarang melalui keranjang kuning</option>
<option>Berhenti menunda, ambil langkah pertamamu sekarang juga</option>
<option>Ingin hasil yang berbeda? Mulai dari sini, klik keranjang kuning</option>
<option>Dapatkan aksesnya sekarang sebelum kamu menyesal melewatkannya</option>
<option>Ribuan orang sudah memulainya, sekarang giliranmu. Cek keranjang kuning</option>
<option>Investasi terbaik untuk dirimu adalah yang kamu lakukan hari ini</option>
<option>Amankan pesananmu sekarang juga, prosesnya cepat dan mudah</option>
<option>Komentar "MAU" di bawah video ini dan detailnya kami kirim sekarang juga</option>
<option>Simpan video ini, lalu beli sekarang sebelum kamu lupa</option>
<option>Tidak perlu menunggu momen sempurna, mulai sekarang lewat keranjang kuning</option>
<option>Pilih paket yang paling cocok untukmu dan rasakan manfaatnya hari ini</option>
<option>Kamu sudah tahu masalahnya, sekarang saatnya solusinya. Klik keranjang kuning</option>
<option>Jangan jadi yang tertinggal, ikut bergabung sekarang juga</option>
<option>Coba sekarang, pilihannya ada di tanganmu. Klik keranjang kuning</option>
<option>Lihat sendiri bedanya, klik keranjang kuning dan mulai hari ini</option>
<option>Hadiahi dirimu sendiri dengan solusi yang sudah lama kamu tunggu</option>
<option>Tag temanmu yang membutuhkan ini, lalu dapatkan aksesnya sekarang</option>
<option>Ambil keputusan hari ini, jangan sampai kamu menyesal esok hari</option>
<option>Klik sekarang, mulai perubahanmu, dan jadilah versi terbaik dirimu</option>
</select>
<div class="hint">Pilih salah satu CTA di atas. Pastikan CTA sesuai dengan fakta produk agar tidak menyesatkan audiens.</div>
<label>Informasi tambahan yang wajib masuk</label><textarea id="extra" placeholder="Fitur, harga, manfaat, cara kerja, batasan, atau detail lain..."></textarea>
<label>Hal yang tidak boleh muncul / diklaim</label><textarea id="avoid" placeholder="Contoh: Jangan mengarang fitur, harga, hasil, atau testimoni."></textarea>
<div class="btns">
<button class="primary" id="generateBtn" type="button">Buat brief saya</button>
<button class="secondary" type="reset">Reset</button>
</div>
</form>
</section>
<section class="panel" id="outputPanel">
<h2>2. Brief siap dikirim</h2>
<p class="hint">Setelah dibuat, salin teks ini dan kirim ke ChatGPT. ChatGPT akan membuat storyboard dengan format ringkas yang kamu inginkan.</p>
<div id="output" class="output">Hasil brief akan muncul di sini setelah kamu memilih opsi dan menekan “Buat brief saya”.</div>
<div class="btns">
<button class="green" id="copy" type="button">Salin brief</button>
<button class="secondary" id="download" type="button">Unduh TXT</button>
</div>
<div class="note">Tips: Untuk hasil paling akurat, sertakan foto produk/karakter dan pastikan detail fitur serta klaim sesuai kenyataan.</div>
</section>
</main>
<footer>AI Video Generator Builder By Bang Ajiib · Satu file HTML · Bisa digunakan di browser HP atau komputer</footer>
</div>
<script>
const form=document.getElementById('briefForm'), output=document.getElementById('output'), generateBtn=document.getElementById('generateBtn'), outputPanel=document.getElementById('outputPanel');
const val=id=>document.getElementById(id).value.trim();
function makeBrief(){
 const total=Number(val('scenes'))*Number(val('duration').split(' ')[0]);
 const lines=[
'Bertindaklah sebagai Scriptwriter, Creative Director, dan Video Director profesional untuk video AI.',
'Buat storyboard dan prompt produksi video berdasarkan brief berikut.',
'',
'INFORMASI PROYEK',
'Judul: '+val('title'),
'Jenis konten: '+val('type'),
'Tujuan: '+val('goal'),
'Platform: '+val('platform'),
'Target audiens: '+val('audience'),
'Jumlah scene: '+val('scenes'),
'Durasi per scene: '+val('duration'),
'Perkiraan durasi total: '+total+' detik',
'AI video generator: '+val('generator'),
'Rasio: '+val('ratio'),
'',
'ARAHAN KREATIF',
'Gaya visual: '+val('visual'),
'Gaya promosi: '+val('promo'),
'Jenis hook: '+val('hook'),
'Gaya voice over: '+val('voice'),
'Karakter: '+val('character'),
'Referensi: '+val('reference'),
'Audio: '+val('audio'),
'CTA: '+(val('cta')||'Buat CTA yang jelas dan sesuai tujuan video.'),
'Informasi tambahan: '+(val('extra')||'Tidak ada detail tambahan.'),
'Hal yang harus dihindari: '+(val('avoid')||'Jangan mengarang spesifikasi, fitur, harga, testimoni, atau klaim.'),
'',
'INSTRUKSI OUTPUT WAJIB',
'Buat '+val('scenes')+' scene sesuai durasi yang ditentukan.',
'Scene pertama harus memiliki HOOK sangat kuat, terutama pada 3 detik pertama.',
'Scene tengah harus menjelaskan masalah, solusi, manfaat, atau demonstrasi secara runtut dan menarik.',
'Scene terakhir harus memiliki CTA yang jelas dan persuasif, gunakan CTA yang sudah ditentukan di atas.',
'Jaga konsistensi karakter, produk, lokasi, pencahayaan, dan gaya visual antar-scene jika relevan.',
'Voice over harus natural, mudah diucapkan, dan sesuai durasi.',
'Jika informasi belum tersedia, jangan mengarang. Gunakan asumsi minimal atau tanyakan satu hal yang paling penting.',
'',
'FORMAT JAWABAN:',
'BAGIAN A — STORYBOARD:',
'Untuk SETIAP scene, berikan HANYA lima bagian berikut:',
'1. Judul Scene',
'2. Ide Visual (adegan, karakter, aktivitas, gerakan kamera, transisi)',
'3. Voice Over',
'4. Teks Layar',
'5. Audio (BGM dan SFX)',
'',
'BAGIAN B — KONTEN SIAP UPLOAD:',
'Setelah seluruh scene selesai, sertakan juga:',
'1. Judul video: menarik, relevan, dan membuat orang penasaran.',
'2. Deskripsi/caption: ringkas, persuasif, sesuai isi video, dan memiliki ajakan bertindak bila relevan.',
'3. Tepat 5 hashtag: relevan dengan topik, produk/program, dan platform. Jangan kurang atau lebih dari 5.',
'Pastikan judul, deskripsi, dan hashtag siap disalin untuk diunggah. Jangan mengarang fakta, fitur, harga, atau klaim.',
'',
'Jangan sertakan gambar/foto atau penjelasan panjang di luar format di atas. Langsung berikan hasil yang siap diproduksi dan diunggah.'
 ];
 output.textContent=lines.join('\\n');
 if(window.innerWidth<=780&&outputPanel){outputPanel.scrollIntoView({behavior:'smooth',block:'start'})}
}
form.addEventListener('submit',e=>{e.preventDefault();makeBrief()});
generateBtn.addEventListener('click',e=>{e.preventDefault();makeBrief()});
document.getElementById('copy').addEventListener('click',async()=>{
 if(output.textContent.startsWith('Hasil brief')){makeBrief()}
 try{await navigator.clipboard.writeText(output.textContent);document.getElementById('copy').textContent='Tersalin ✓';setTimeout(()=>document.getElementById('copy').textContent='Salin brief',1400)}
 catch(e){const t=document.createElement('textarea');t.value=output.textContent;document.body.append(t);t.select();document.execCommand('copy');t.remove();document.getElementById('copy').textContent='Tersalin ✓'}
});
document.getElementById('download').addEventListener('click',()=>{
 if(output.textContent.startsWith('Hasil brief'))makeBrief();
 const blob=new Blob([output.textContent],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='brief-video-ai.txt';a.click();URL.revokeObjectURL(url);
});
form.addEventListener('reset',()=>setTimeout(()=>{output.textContent='Hasil brief akan muncul di sini setelah kamu memilih opsi dan menekan “Buat brief saya”.'},0));
</script>
</body>
</html>`;

export function isTrialAiGeneratorMenu(menu: SystemMenuItem): boolean {
  const id = String(menu.id || '').trim().toLowerCase();
  const name = String(menu.name || '').trim().toLowerCase();
  const url = String(menu.url || '').trim().toLowerCase();
  return (
    id === 'trial_ai_generator' ||
    name === 'trial ai generator' ||
    url.includes('trial-ai-generator.html')
  );
}

export function isMateriSystemMenu(menu: SystemMenuItem): boolean {
  const id = String(menu.id || '').trim().toLowerCase();
  const name = String(menu.name || '').trim().toLowerCase();
  const url = String(menu.url || '').trim().toLowerCase();
  return (
    id === 'materi' ||
    name === 'materi' ||
    url === '/materi' ||
    url.endsWith('/materi')
  );
}

export function extractYoutubeVideoId(rawUrl: string): string | null {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) return vParam;

      const segments = parsed.pathname.split('/').filter(Boolean);
      const prefixIdx = segments.findIndex((s) =>
        ['embed', 'shorts', 'live', 'v'].includes(s.toLowerCase())
      );
      if (prefixIdx !== -1 && segments[prefixIdx + 1]) {
        const candidate = segments[prefixIdx + 1];
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate;
      }
    }
  } catch {
    // Gunakan regex fallback di bawah
  }

  const regexMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return regexMatch && regexMatch[1] ? regexMatch[1] : null;
}

export function getYoutubeEmbedUrl(rawUrl: string): string | null {
  const videoId = extractYoutubeVideoId(rawUrl);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

export function getYoutubeThumbnailUrl(rawUrl: string): string | null {
  const videoId = extractYoutubeVideoId(rawUrl);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYoutubeWatchUrl(rawUrl: string): string {
  const videoId = extractYoutubeVideoId(rawUrl);
  if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return 'https://www.youtube.com';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const DEFAULT_MATERI_MODULES: MateriModuleItem[] = [];

const DEMO_MATERI_IDS = new Set([
  'materi_dasar_ai_video',
  'materi_strategi_affiliate',
  'materi_animasi_karakter',
]);

export function sanitizeMateriModules(raw: unknown): MateriModuleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      const obj = item as Partial<MateriModuleItem>;
      const id = String(obj.id || '').trim();
      return !DEMO_MATERI_IDS.has(id);
    })
    .map((item, idx) => {
      const obj = item as Partial<MateriModuleItem>;
      const rawVideos = Array.isArray(obj.videos) ? obj.videos : [];
      const videos: MateriVideoItem[] = rawVideos
        .filter((v) => v && typeof v === 'object' && String(v.youtubeUrl || '').trim())
        .map((v, vIdx) => ({
          id: String(v.id || `vid_${idx}_${vIdx}_${Date.now().toString(36)}`).trim(),
          title: String(v.title || `Video Pembelajaran ${vIdx + 1}`).trim(),
          youtubeUrl: String(v.youtubeUrl || '').trim(),
          ...(typeof v.description === 'string' && v.description.trim()
            ? { description: v.description.trim() }
            : {}),
        }));

      return {
        id: String(obj.id || `materi_${idx + 1}`).trim(),
        title: String(obj.title || `Materi Pembelajaran ${idx + 1}`).trim(),
        category: String(obj.category || 'Materi Umum').trim(),
        description: String(obj.description || '').trim(),
        content: String(obj.content || '').trim(),
        videos,
        updatedAt: String(obj.updatedAt || new Date().toISOString()).trim(),
      };
    });
}

const LOCAL_STORAGE_TRIAL_HTML_KEY = 'bang_ajiib_trial_html_v1';
const LOCAL_STORAGE_MATERI_MODULES_KEY = 'bang_ajiib_materi_modules_v2';

export function getSavedMateriModulesClient(menus?: SystemMenuItem[]): MateriModuleItem[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('bang_ajiib_materi_modules_v1');
    } catch {
      // Abaikan
    }
  }
  if (Array.isArray(menus)) {
    const materiMenu = menus.find((m) => isMateriSystemMenu(m));
    if (materiMenu && Array.isArray(materiMenu.materiModules)) {
      return sanitizeMateriModules(materiMenu.materiModules);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_MATERI_MODULES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeMateriModules(parsed);
        }
      }
    } catch {
      // Abaikan
    }
  }
  return [];
}

export function setSavedMateriModulesClient(modules: MateriModuleItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('bang_ajiib_materi_modules_v1');
    window.localStorage.setItem(
      LOCAL_STORAGE_MATERI_MODULES_KEY,
      JSON.stringify(sanitizeMateriModules(modules))
    );
  } catch {
    // Abaikan
  }
}

export function getSavedTrialHtmlClient(menus?: SystemMenuItem[]): string {
  if (Array.isArray(menus)) {
    const trialItem = menus.find((m) => isTrialAiGeneratorMenu(m));
    if (trialItem && typeof trialItem.customHtml === 'string' && trialItem.customHtml.trim()) {
      return trialItem.customHtml;
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(LOCAL_STORAGE_TRIAL_HTML_KEY);
      if (saved && saved.trim()) {
        return saved;
      }
    } catch {
      // Abaikan
    }
  }
  return TRIAL_AI_GENERATOR_HTML;
}

export function setSavedTrialHtmlClient(html: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (html && html.trim()) {
      window.localStorage.setItem(LOCAL_STORAGE_TRIAL_HTML_KEY, html);
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_TRIAL_HTML_KEY);
    }
  } catch {
    // Abaikan
  }
}

export function prepareTrialHtmlForExecution(rawHtml: string): string {
  const baseHtml = String(rawHtml || '').trim() || TRIAL_AI_GENERATOR_HTML;
  const helperScript = `
<script>
(function(){
  try {
    var form = document.getElementById('briefForm');
    if (form) {
      form.setAttribute('novalidate', 'novalidate');
      var reqInputs = form.querySelectorAll('[required]');
      for (var i = 0; i < reqInputs.length; i++) {
        reqInputs[i].removeAttribute('required');
      }
      var submitBtns = form.querySelectorAll('button[type="submit"], button.primary, #generateBtn');
      for (var j = 0; j < submitBtns.length; j++) {
        submitBtns[j].addEventListener('click', function(e) {
          if (typeof window.makeBrief === 'function') {
            e.preventDefault();
            window.makeBrief();
            var out = document.getElementById('output');
            if (window.innerWidth <= 780 && out) {
              out.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        });
      }
    }
  } catch (err) {}
})();
</script>`;
  if (/<\/body>/i.test(baseHtml)) {
    return baseHtml.replace(/<\/body>/i, `${helperScript}\n</body>`);
  }
  return `${baseHtml}\n${helperScript}`;
}

export function ensureRequiredSystemMenus(menus: SystemMenuItem[]): SystemMenuItem[] {
  const list = Array.isArray(menus) ? [...menus] : [...DEFAULT_SYSTEM_MENUS];
  const hasTrial = list.some((m) => isTrialAiGeneratorMenu(m));
  if (!hasTrial) {
    list.push({ ...TRIAL_AI_GENERATOR_MENU });
  }
  const hasMateri = list.some((m) => isMateriSystemMenu(m));
  if (!hasMateri) {
    list.push({
      ...MATERI_SYSTEM_MENU,
      materiModules: getSavedMateriModulesClient(),
    });
  }
  return list.map((m) => {
    const isTrial = isTrialAiGeneratorMenu(m);
    const isMateri = isMateriSystemMenu(m);
    const customHtmlVal =
      typeof m.customHtml === 'string' && m.customHtml.trim() ? m.customHtml : undefined;
    if (isTrial && customHtmlVal) {
      setSavedTrialHtmlClient(customHtmlVal);
    }
    const hasExplicitMateriModules = Array.isArray(m.materiModules);
    const materiModulesVal = hasExplicitMateriModules
      ? sanitizeMateriModules(m.materiModules)
      : isMateri
        ? getSavedMateriModulesClient()
        : undefined;
    if (isMateri && hasExplicitMateriModules && materiModulesVal) {
      setSavedMateriModulesClient(materiModulesVal);
    }
    return {
      id: String(m.id || '').trim(),
      name: String(m.name || '').trim(),
      url:
        isTrial && (!m.url || m.url.includes('trial-ai-generator.html'))
          ? '/trial-ai-generator.html'
          : isMateri && (!m.url || m.url.includes('/materi'))
            ? '/materi'
            : normalizeMenuUrl(m.url),
      ...(customHtmlVal ? { customHtml: customHtmlVal } : {}),
      ...(isMateri && materiModulesVal ? { materiModules: materiModulesVal } : {}),
    };
  });
}

/**
 * Pengaturan Izin Akses Menu oleh Admin:
 * - 'both': Bisa akses semua menu yang tersedia
 * - 'none': Tidak bisa akses menu manapun (menunggu persetujuan Admin)
 * - '<menu_id>' atau '<id1>,<id2>': Hanya bisa akses menu tertentu yang diizinkan Admin
 */
export type MenuAccessPermission = string;

export interface EncryptedProfileFields {
  passwordCipher: string;
  nikCipher: string;
  phoneCipher: string;
  addressCipher: string;
  notesCipher: string;
  keyFingerprint: string;
  algorithm: 'AES-256-GCM';
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password: string;
  role: UserRole;
  status: AccountStatus;
  menuAccess: MenuAccessPermission;
  department: string;
  position: string;
  nik: string;
  phone: string;
  address: string;
  personalNotes: string;
  securityClearance: string;
  joinedAt: string;
  lastLoginAt: string;
  lastSyncedAt: string;
  syncVersion: number;
  encryptedVault: EncryptedProfileFields;
}

export type ActivityCategory = 'Autentikasi' | 'Pembaruan Data' | 'Sinkronisasi' | 'Keamanan';

export interface ActivityRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  category: ActivityCategory;
  title: string;
  description: string;
  timestamp: string;
  deviceInfo: string;
  syncStatus: 'Tersinkronisasi ke Spreadsheet' | 'Tersimpan Terenkripsi';
  integrityHash: string;
}

export interface SyncTelemetry {
  lastSyncTime: string;
  syncState: 'Terhubung & Sinkron' | 'Menyinkronkan...' | 'Mode Siaga Aktif';
  spreadsheetId: string;
  spreadsheetUrl: string;
  appsScriptUrl: string;
  totalSyncCycles: number;
  autoSyncIntervalSec: number;
  sheetRowsDetected: number;
  appsScriptStatus: string;
}

export function normalizeMenuUrl(rawUrl: string): string {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return 'https://';
  if (trimmed.startsWith('/')) return trimmed;
  if (
    trimmed.includes('trial-ai-generator.html') &&
    !/^https?:\/\/[^/]+\/trial-ai-generator\.html/i.test(trimmed)
  ) {
    return '/trial-ai-generator.html';
  }
  if (trimmed.toLowerCase() === 'materi' || trimmed.toLowerCase().endsWith('/materi')) {
    return '/materi';
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function normalizeMenuAccessValue(
  rawAccess: string,
  menus?: SystemMenuItem[]
): MenuAccessPermission {
  const trimmed = String(rawAccess || '')
    .replace(/^Akses:\s*/i, '')
    .trim();
  if (!trimmed) return 'both';

  const lower = trimmed.toLowerCase();
  if (
    lower === 'both' ||
    lower === 'all' ||
    lower === 'semua menu' ||
    lower === 'semua' ||
    lower.startsWith('semua menu (') ||
    lower === 'fashion & ai generator'
  ) {
    return 'both';
  }
  if (
    lower === 'none' ||
    lower === 'tidak ada' ||
    lower === 'belum diizinkan' ||
    lower === '-'
  ) {
    return 'none';
  }

  const activeMenus = Array.isArray(menus) && menus.length > 0 ? menus : DEFAULT_SYSTEM_MENUS;
  const parts = trimmed
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const resolvedIds: string[] = [];

  for (const part of parts) {
    const cleanPart = part.replace(/\s+saja$/i, '').trim();
    const pLower = cleanPart.toLowerCase();

    if (
      pLower === 'both' ||
      pLower === 'all' ||
      pLower === 'semua menu' ||
      pLower === 'semua'
    ) {
      return 'both';
    }
    if (pLower === 'none' || pLower === 'tidak ada' || pLower === 'belum diizinkan') {
      continue;
    }

    let matchedId: string | null = null;

    // 1. Cek kecocokan langsung terhadap daftar menu aktif (berdasarkan ID atau Nama Menu)
    const foundMenu = activeMenus.find(
      (m) =>
        m.id.trim().toLowerCase() === pLower || m.name.trim().toLowerCase() === pLower
    );
    if (foundMenu) {
      matchedId = foundMenu.id.trim();
    } else if (pLower === 'fashion' || pLower === 'ai generator fashion') {
      matchedId = 'fashion';
    } else if (
      pLower === 'ai_generator' ||
      pLower === 'ai generator' ||
      pLower === 'ai generator affiliate'
    ) {
      matchedId = 'ai_generator';
    } else if (
      pLower === 'menu_ai_generator_animation_dk98' ||
      pLower === 'ai generator animation'
    ) {
      const animMenu = activeMenus.find(
        (m) =>
          m.id.toLowerCase().includes('animation') ||
          m.name.toLowerCase().includes('animation')
      );
      matchedId = animMenu ? animMenu.id.trim() : 'menu_ai_generator_animation_dk98';
    } else if (
      pLower === 'trial_ai_generator' ||
      pLower === 'trial ai generator'
    ) {
      const trialMenu = activeMenus.find((m) => isTrialAiGeneratorMenu(m));
      matchedId = trialMenu ? trialMenu.id.trim() : 'trial_ai_generator';
    } else if (pLower === 'materi' || pLower === 'menu materi') {
      const materiMenu = activeMenus.find((m) => isMateriSystemMenu(m));
      matchedId = materiMenu ? materiMenu.id.trim() : 'materi';
    } else {
      matchedId = cleanPart;
    }

    if (matchedId && !resolvedIds.includes(matchedId)) {
      resolvedIds.push(matchedId);
    }
  }

  if (resolvedIds.length === 0) {
    return 'none';
  }

  if (
    activeMenus.length > 0 &&
    activeMenus.every((m) =>
      resolvedIds.some((id) => id.toLowerCase() === m.id.trim().toLowerCase())
    )
  ) {
    return 'both';
  }

  return resolvedIds.join(',');
}

export function canUserAccessMenu(
  user: UserRecord,
  menuId: string,
  menus?: SystemMenuItem[]
): boolean {
  if (user.role === 'admin') return true;
  const activeMenus =
    Array.isArray(menus) && menus.length > 0 ? menus : getCachedMenusClient();
  const normalizedAccess = normalizeMenuAccessValue(user.menuAccess || 'both', activeMenus);
  if (normalizedAccess === 'both' || normalizedAccess === 'all') return true;
  if (normalizedAccess === 'none' || !normalizedAccess) return false;

  const allowedIds = normalizedAccess
    .split(',')
    .map((id) => id.trim().toLowerCase())
    .filter(Boolean);

  const targetId = String(menuId || '').trim().toLowerCase();
  if (allowedIds.includes(targetId)) return true;

  const matchedMenu = activeMenus.find((m) => m.id.trim().toLowerCase() === targetId);
  if (matchedMenu && allowedIds.includes(matchedMenu.name.trim().toLowerCase())) {
    return true;
  }

  return false;
}

export function formatStatusWithMenuAccess(
  status: AccountStatus,
  menuAccess: MenuAccessPermission,
  menus?: SystemMenuItem[]
): string {
  const cleanAccess = normalizeMenuAccessValue(menuAccess || 'both', menus);
  const accessLabel =
    cleanAccess === 'both'
      ? 'Akses: Semua Menu'
      : cleanAccess === 'none'
        ? 'Akses: Tidak Ada'
        : `Akses: ${cleanAccess}`;
  return `${status} | ${accessLabel}`;
}

export function parseStatusAndMenuAccess(
  rawStatusCell: string,
  rawMenuCell: string,
  role: UserRole,
  menus?: SystemMenuItem[]
): { status: AccountStatus; menuAccess: MenuAccessPermission } {
  const baseStatus: AccountStatus = rawStatusCell.includes('Menunggu Verifikasi')
    ? 'Menunggu Verifikasi'
    : rawStatusCell.includes('Dibekukan Sementara')
      ? 'Dibekukan Sementara'
      : 'Aktif & Terverifikasi';

  if (role === 'admin') {
    return { status: baseStatus, menuAccess: 'both' };
  }

  // Prioritaskan nilai Akses dari kolom Status Akun karena Kode.gs 6-kolom selalu memperbarui kolom ini
  const aksesMatch = rawStatusCell.match(/\|\s*Akses:\s*(.+)$/i);
  if (aksesMatch && aksesMatch[1]) {
    return {
      status: baseStatus,
      menuAccess: normalizeMenuAccessValue(aksesMatch[1], menus),
    };
  }

  const trimmedMenuCell = String(rawMenuCell || '').trim();
  if (trimmedMenuCell) {
    return {
      status: baseStatus,
      menuAccess: normalizeMenuAccessValue(trimmedMenuCell, menus),
    };
  }

  return { status: baseStatus, menuAccess: 'both' };
}

const MENU_CFG_MARKER = '|MCFG:';
const LOCAL_STORAGE_MENUS_KEY = 'bang_ajiib_menus_v1';

export function attachMenusToTimestamp(isoTimestamp: string, menus: SystemMenuItem[]): string {
  try {
    const cleanTs = String(isoTimestamp || '')
      .split(MENU_CFG_MARKER)[0]
      .trim() || new Date().toISOString();
    const encoded = btoa(encodeURIComponent(JSON.stringify(menus)));
    return `${cleanTs}${MENU_CFG_MARKER}${encoded}`;
  } catch {
    return isoTimestamp;
  }
}

export function extractMenusFromTimestamp(rawCell: string): {
  cleanTimestamp: string;
  menus: SystemMenuItem[] | null;
} {
  const str = String(rawCell || '').trim();
  const idx = str.indexOf(MENU_CFG_MARKER);
  if (idx === -1) {
    return { cleanTimestamp: str, menus: null };
  }
  const cleanTimestamp = str.slice(0, idx).trim() || new Date().toISOString();
  const encoded = str.slice(idx + MENU_CFG_MARKER.length).trim();
  try {
    const decoded = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(decoded);
    if (Array.isArray(parsed)) {
      const validMenus: SystemMenuItem[] = parsed
        .filter(
          (m) =>
            m &&
            typeof m.id === 'string' &&
            typeof m.name === 'string' &&
            typeof m.url === 'string'
        )
        .map((m) => ({
          id: m.id.trim(),
          name: m.name.trim(),
          url: normalizeMenuUrl(m.url),
          ...(typeof m.customHtml === 'string' && m.customHtml.trim()
            ? { customHtml: m.customHtml }
            : {}),
          ...(Array.isArray(m.materiModules)
            ? { materiModules: sanitizeMateriModules(m.materiModules) }
            : {}),
        }));
      return { cleanTimestamp, menus: ensureRequiredSystemMenus(validMenus) };
    }
  } catch {
    // Abaikan jika gagal decode
  }
  return { cleanTimestamp, menus: null };
}

export function getCachedMenusClient(): SystemMenuItem[] {
  if (typeof window === 'undefined') return DEFAULT_SYSTEM_MENUS;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_MENUS_KEY);
    if (!raw) return DEFAULT_SYSTEM_MENUS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return ensureRequiredSystemMenus(parsed);
    }
  } catch {
    // Fallback ke default
  }
  return DEFAULT_SYSTEM_MENUS;
}

export function setCachedMenusClient(menus: SystemMenuItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(menus));
  } catch {
    // Abaikan jika storage penuh
  }
}

function buildClientVault(email: string, password: string): EncryptedProfileFields {
  return {
    passwordCipher: `AES256GCM$${btoa(encodeURIComponent(`${email}:${password}`))}`,
    nikCipher: '-',
    phoneCipher: '-',
    addressCipher: '-',
    notesCipher: '-',
    keyFingerprint: email.slice(0, 8).toUpperCase(),
    algorithm: 'AES-256-GCM',
  };
}

/**
 * Mengambil daftar user dan konfigurasi menu langsung dari Google Apps Script (doGet)
 */
export async function fetchUsersAndMenusDirectlyFromAppsScript(): Promise<{
  users: UserRecord[];
  menus: SystemMenuItem[];
}> {
  const now = new Date().toISOString();
  const separator = PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL.includes('?') ? '&' : '?';
  const res = await fetch(`${PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL}${separator}_t=${Date.now()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Gagal menghubungi server database Spreadsheet.');
  }

  const data = await res.json();
  const rawRows: unknown[][] = Array.isArray(data?.users) ? data.users : [];
  const users: UserRecord[] = [];
  let detectedMenus: SystemMenuItem[] | null = Array.isArray(data?.menus) ? data.menus : null;

  // Langkah 1: Ekstrak konfigurasi menu terlebih dahulu agar parseStatusAndMenuAccess mengenali semua nama & ID menu
  rawRows.forEach((row) => {
    const cells = (row || []).map((c) => String(c ?? '').trim());
    const emailCell = cells.find((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    if (!emailCell || emailCell.toLowerCase() === 'email') return;
    const emailIdx = cells.indexOf(emailCell);
    const rawSyncCell = cells[emailIdx + 5] || now;
    const { menus: rowMenus } = extractMenusFromTimestamp(rawSyncCell);
    if (rowMenus) {
      detectedMenus = rowMenus;
    }
  });

  const finalMenus = ensureRequiredSystemMenus(detectedMenus || getCachedMenusClient());
  setCachedMenusClient(finalMenus);

  // Langkah 2: Parse seluruh baris pengguna beserta izin akses menu yang telah dinormalisasi
  rawRows.forEach((row, idx) => {
    const cells = (row || []).map((c) => String(c ?? '').trim());
    const emailCell = cells.find((val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val));
    if (!emailCell || emailCell.toLowerCase() === 'email') return;

    const normalizedEmail = emailCell.toLowerCase();
    const emailIdx = cells.indexOf(emailCell);
    const nameVal = cells[emailIdx + 1] || normalizedEmail.split('@')[0];
    const passwordVal = cells[emailIdx + 2] || '-';
    const roleVal: UserRole =
      (cells[emailIdx + 3] || '').toLowerCase() === 'admin' ? 'admin' : 'user';
    const rawStatusCell = cells[emailIdx + 4] || 'Aktif & Terverifikasi';
    const rawSyncCell = cells[emailIdx + 5] || now;
    const rawMenuCell = cells[emailIdx + 6] || '';

    const { cleanTimestamp } = extractMenusFromTimestamp(rawSyncCell);

    const { status: statusVal, menuAccess } = parseStatusAndMenuAccess(
      rawStatusCell,
      rawMenuCell,
      roleVal,
      finalMenus
    );

    users.push({
      id: `USR-${String(idx + 1).padStart(3, '0')}`,
      email: normalizedEmail,
      name: nameVal,
      password: passwordVal,
      role: roleVal,
      status: statusVal,
      menuAccess,
      department: '-',
      position: roleVal === 'admin' ? 'Admin' : 'User',
      nik: '-',
      phone: '-',
      address: '-',
      personalNotes: '-',
      securityClearance: roleVal === 'admin' ? 'Otoritas Admin' : 'Akses Personal Terisolasi',
      joinedAt: cleanTimestamp,
      lastLoginAt: now,
      lastSyncedAt: cleanTimestamp,
      syncVersion: 1,
      encryptedVault: buildClientVault(normalizedEmail, passwordVal),
    });
  });

  return { users, menus: finalMenus };
}

export async function fetchUsersDirectlyFromAppsScript(): Promise<UserRecord[]> {
  const { users } = await fetchUsersAndMenusDirectlyFromAppsScript();
  return users;
}

/**
 * Menyimpan daftar user dan konfigurasi menu langsung ke Google Apps Script (doPost)
 */
export async function pushUsersDirectlyToAppsScript(
  users: UserRecord[],
  reason: string,
  menusOverride?: SystemMenuItem[]
): Promise<void> {
  const now = new Date().toISOString();
  const activeMenus = menusOverride || getCachedMenusClient();
  setCachedMenusClient(activeMenus);

  await fetch(PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'syncUsers',
      sheetName: 'DataUser',
      columns: [
        'Email',
        'Nama',
        'Password',
        'Role',
        'Status Akun',
        'Terakhir Sinkron',
        'Akses Menu',
      ],
      reason,
      spreadsheetId: PERMANENT_LINKS.SPREADSHEET_ID,
      timestamp: now,
      menus: activeMenus,
      users: users.map((u: UserRecord, idx: number) => {
        const cleanMenuAccess =
          u.role === 'admin' ? 'both' : normalizeMenuAccessValue(u.menuAccess, activeMenus);
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          password: u.password,
          role: u.role,
          status: formatStatusWithMenuAccess(u.status, cleanMenuAccess, activeMenus),
          menuAccess: cleanMenuAccess,
          department: u.department,
          position: u.position,
          lastSyncedAt: idx === 0 ? attachMenusToTimestamp(now, activeMenus) : now,
          encryptedVault: u.encryptedVault,
        };
      }),
    }),
  });
}

export function buildDirectTelemetry(usersCount: number): SyncTelemetry {
  return {
    lastSyncTime: new Date().toISOString(),
    syncState: 'Terhubung & Sinkron',
    spreadsheetId: PERMANENT_LINKS.SPREADSHEET_ID,
    spreadsheetUrl: PERMANENT_LINKS.SPREADSHEET_EDIT_URL,
    appsScriptUrl: PERMANENT_LINKS.APPS_SCRIPT_EXEC_URL,
    totalSyncCycles: 1,
    autoSyncIntervalSec: 15,
    sheetRowsDetected: usersCount,
    appsScriptStatus: 'Sheet DataUser Tersinkronisasi (OK)',
  };
}
