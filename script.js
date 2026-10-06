'use strict';

// ===================================================
// ===== UMUMIY YORDAMCHILAR =====
// ===================================================
const $ = (id) => document.getElementById(id);

const SVG = {
    x: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>',
    plus: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>',
    left: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>',
    right: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>',
    up: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"></path></svg>',
    down: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>',
    file: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>'
};

function uid() {
    return Math.random().toString(36).slice(2, 11);
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function baseName(name, fallback) {
    const base = String(name || '').replace(/\.[^/.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').trim();
    return base || fallback;
}

function nextFrame() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

function iconButton(className, label, svg, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.setAttribute('aria-label', label);
    btn.title = label;
    btn.innerHTML = svg;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        onClick();
    });
    return btn;
}

function setBusy(btn, textEl, busy, text) {
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
    textEl.textContent = text;
}

function triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareBlob(blob, fileName, title) {
    const file = new File([blob], fileName, { type: blob.type });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title });
            return 'shared';
        } catch (err) {
            return err && err.name === 'AbortError' ? 'cancelled' : 'error';
        }
    }
    return 'unsupported';
}

function requireLib(name, ok) {
    if (!ok) {
        showToast(`${name} kutubxonasi yuklanmadi. Internetni tekshirib, sahifani yangilang`, 'error');
        return false;
    }
    return true;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Rasmni o\'qib bo\'lmadi'));
        img.src = src;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

// Brauzer sahifadan tashqariga tashlangan faylni ochib yubormasligi uchun
['dragover', 'drop'].forEach((evt) => {
    window.addEventListener(evt, (e) => e.preventDefault());
});

function setupDropzone(area, input, onFiles) {
    area.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        input.click();
    });
    area.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === area) {
            e.preventDefault();
            input.click();
        }
    });
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.classList.add('dragover');
    });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.classList.remove('dragover');
        onFiles(Array.from(e.dataTransfer.files));
    });
    input.addEventListener('change', () => {
        const files = Array.from(input.files);
        input.value = ''; // bir xil faylni qayta tanlash mumkin bo'lishi uchun
        onFiles(files);
    });
}

// ===== SAHIFA NAVIGATSIYASI =====
function switchPage(page) {
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach((n) => {
        n.classList.remove('active');
        n.removeAttribute('aria-current');
    });

    $('page-' + page).classList.add('active');
    const nav = $('nav-' + page);
    nav.classList.add('active');
    nav.setAttribute('aria-current', 'page');
}

document.querySelectorAll('.feature-item[role="button"]').forEach((item) => {
    item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
        }
    });
});

// ===== TOAST =====
let toastTimer = null;

function showToast(message, type = 'info') {
    const toast = $('toast');
    const toastText = toast.querySelector('.toast-text');
    const toastIcon = toast.querySelector('.toast-icon');

    const icons = {
        success: 'M5 13l4 4L19 7',
        error: 'M6 18L18 6M6 6l12 12',
        warning: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    toastIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[type] || icons.info}"></path>`;
    toast.className = `toast ${type}`;
    toastText.textContent = message;
    // reflow: ketma-ket toastlarda animatsiya qayta ishlashi uchun
    void toast.offsetWidth;
    toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), type === 'error' || type === 'warning' ? 4200 : 2600);
}

// ===================================================
// ===== 2PDF (rasmdan PDF) =====
// ===================================================
const MAX_IMAGES = 50;
const PAGE_MARGIN_MM = 10;
const A4 = { w: 210, h: 297 };
const PDF_MAX_SIDE_PX = 3000; // A4 uchun ~300 dpi ga yaqin, hajmni juda oshirmaydi

let images = []; // { id, file, url, name }
let pdfBlob = null;
let separateMode = false;
let isZipResult = false;

const el = {
    uploadArea: $('uploadArea'),
    fileInput: $('fileInput'),
    uploadSection: $('uploadSection'),
    previewSection: $('previewSection'),
    pdfPreviewSection: $('pdfPreviewSection'),
    previewGrid: $('previewGrid'),
    imageCount: $('imageCount'),
    actionButtons: $('actionButtons'),
    pdfButtons: $('pdfButtons'),
    convertBtn: $('convertBtn'),
    convertBtnText: $('convertBtnText'),
    pdfPageCount: $('pdfPageCount'),
    pdfSize: $('pdfSize'),
    backButton: $('backButton'),
    separateToggleCard: $('separateToggleCard'),
    separateToggle: $('separateToggle'),
    pdfResultTitle: $('pdfResultTitle'),
    pdfResultInfo: $('pdfResultInfo'),
    pdfPageStat: $('pdfPageStat'),
    pdfFileStat: $('pdfFileStat'),
    pdfFileCountVal: $('pdfFileCountVal')
};

function convertLabel() {
    return separateMode && images.length > 1 ? 'PDFlarni yaratish' : 'PDF yaratish';
}

el.separateToggle.addEventListener('change', () => {
    separateMode = el.separateToggle.checked;
    el.convertBtnText.textContent = convertLabel();
});

setupDropzone(el.uploadArea, el.fileInput, handleFiles);

async function handleFiles(files) {
    if (!files.length) return;

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
        showToast('Faqat rasm fayllari qo\'llab-quvvatlanadi', 'error');
    }

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
        showToast(`Eng ko'pi bilan ${MAX_IMAGES} ta rasm qo'shish mumkin`, 'warning');
        return;
    }
    const accepted = imageFiles.slice(0, room);
    if (accepted.length < imageFiles.length) {
        showToast(`Faqat ${MAX_IMAGES} ta rasmgacha qabul qilinadi`, 'warning');
    }
    if (!accepted.length) return;

    // Tanlangan tartib saqlanishi uchun Promise.all (asinxron yuklash tartibni buzmaydi)
    const results = await Promise.all(accepted.map(async (file) => {
        const url = URL.createObjectURL(file);
        try {
            await loadImage(url);
            return { id: uid(), file, url, name: file.name };
        } catch (err) {
            URL.revokeObjectURL(url);
            return null;
        }
    }));

    const ok = results.filter(Boolean);
    const failed = results.length - ok.length;
    const firstNew = images.length;
    images.push(...ok);
    renderPreview(firstNew);
    updatePdfUI();

    if (failed > 0) showToast(`${failed} ta rasmni ochib bo'lmadi (format qo'llab-quvvatlanmaydi)`, 'error');
    else if (ok.length) showToast(`${ok.length} ta rasm yuklandi`, 'success');
}

function renderPreview(animateFrom = images.length) {
    el.previewGrid.innerHTML = '';

    const addMore = document.createElement('button');
    addMore.type = 'button';
    addMore.className = 'add-more-button';
    addMore.setAttribute('aria-label', 'Yana rasm qo\'shish');
    addMore.innerHTML = SVG.plus;
    addMore.addEventListener('click', () => el.fileInput.click());
    el.previewGrid.appendChild(addMore);

    images.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'preview-item' + (i >= animateFrom ? ' enter' : '');
        if (i >= animateFrom) item.style.animationDelay = `${Math.min(i - animateFrom, 8) * 0.03}s`;

        const pic = document.createElement('img');
        pic.src = img.url;
        pic.alt = img.name;
        pic.draggable = false;
        item.appendChild(pic);

        const badge = document.createElement('span');
        badge.className = 'order-badge';
        badge.textContent = i + 1;
        item.appendChild(badge);

        item.appendChild(iconButton('remove-button', 'Rasmni o\'chirish', SVG.x, () => removeImage(img.id)));

        if (images.length > 1) {
            const mover = document.createElement('div');
            mover.className = 'move-controls';
            const left = iconButton('move-btn', 'Oldinga', SVG.left, () => moveImage(img.id, -1));
            const right = iconButton('move-btn', 'Orqaga', SVG.right, () => moveImage(img.id, 1));
            left.disabled = i === 0;
            right.disabled = i === images.length - 1;
            mover.append(left, right);
            item.appendChild(mover);
        }

        el.previewGrid.appendChild(item);
    });
}

function moveImage(id, dir) {
    const i = images.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= images.length) return;
    [images[i], images[j]] = [images[j], images[i]];
    renderPreview();
}

function removeImage(id) {
    const target = images.find((x) => x.id === id);
    if (target) URL.revokeObjectURL(target.url);
    images = images.filter((x) => x.id !== id);
    renderPreview();
    updatePdfUI();
    showToast('Rasm o\'chirildi', 'info');
}

function updatePdfUI() {
    const hasImages = images.length > 0;
    const hasPDF = pdfBlob !== null;

    if (hasPDF) {
        el.uploadSection.classList.add('hidden');
        el.previewSection.style.display = 'none';
        el.pdfPreviewSection.style.display = 'block';
        el.actionButtons.classList.add('hidden');
        el.pdfButtons.classList.remove('hidden');
        el.backButton.classList.remove('hidden');
    } else if (hasImages) {
        el.uploadSection.classList.add('hidden');
        el.previewSection.style.display = 'block';
        el.pdfPreviewSection.style.display = 'none';
        el.actionButtons.classList.remove('hidden');
        el.pdfButtons.classList.add('hidden');
        el.imageCount.textContent = `${images.length} ta rasm`;
        el.backButton.classList.remove('hidden');

        if (images.length > 1) {
            el.separateToggleCard.style.display = 'flex';
        } else {
            el.separateToggleCard.style.display = 'none';
            separateMode = false;
            el.separateToggle.checked = false;
        }
        el.convertBtnText.textContent = convertLabel();
    } else {
        el.uploadSection.classList.remove('hidden');
        el.previewSection.style.display = 'none';
        el.pdfPreviewSection.style.display = 'none';
        el.actionButtons.classList.add('hidden');
        el.pdfButtons.classList.add('hidden');
        el.backButton.classList.add('hidden');
        el.separateToggleCard.style.display = 'none';
    }
}

// Rasmni JPEG ga o'tkazadi (shaffoflik oq fonga, katta rasmlar kichraytiriladi).
// Bu PNG/WebP/GIF kabi formatlar jsPDF da buzilmasligini ta'minlaydi.
async function imageToJpeg(url) {
    const img = await loadImage(url);
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const scale = Math.min(1, PDF_MAX_SIDE_PX / Math.max(nw, nh));
    const w = Math.max(1, Math.round(nw * scale));
    const h = Math.max(1, Math.round(nh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    canvas.width = canvas.height = 0; // xotirani bo'shatish
    return { dataUrl, w, h };
}

function newPdf(orientation) {
    return new window.jspdf.jsPDF({ orientation, unit: 'mm', format: 'a4', compress: true });
}

function placeOnPage(pdf, jpeg, orientation) {
    const pw = orientation === 'l' ? A4.h : A4.w;
    const ph = orientation === 'l' ? A4.w : A4.h;
    const maxW = pw - PAGE_MARGIN_MM * 2;
    const maxH = ph - PAGE_MARGIN_MM * 2;
    const ratio = Math.min(maxW / jpeg.w, maxH / jpeg.h);
    const fw = jpeg.w * ratio;
    const fh = jpeg.h * ratio;
    pdf.addImage(jpeg.dataUrl, 'JPEG', (pw - fw) / 2, (ph - fh) / 2, fw, fh, undefined, 'FAST');
}

function orientationOf(jpeg) {
    return jpeg.w > jpeg.h ? 'l' : 'p';
}

async function convertToPDF() {
    if (images.length === 0) return;
    if (!requireLib('jsPDF', window.jspdf && window.jspdf.jsPDF)) return;

    const useSeparate = separateMode && images.length > 1;
    if (useSeparate && !requireLib('JSZip', window.JSZip)) return;

    setBusy(el.convertBtn, el.convertBtnText, true, 'Yaratilmoqda...');

    try {
        if (useSeparate) {
            const zip = new JSZip();

            for (let i = 0; i < images.length; i++) {
                el.convertBtnText.textContent = `Yaratilmoqda ${i + 1}/${images.length}`;
                await nextFrame();

                const jpeg = await imageToJpeg(images[i].url);
                const orientation = orientationOf(jpeg);
                const pdf = newPdf(orientation);
                placeOnPage(pdf, jpeg, orientation);

                const name = baseName(images[i].name, `rasm-${i + 1}`);
                zip.file(`${String(i + 1).padStart(2, '0')}-${name}.pdf`, pdf.output('blob'));
            }

            pdfBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'STORE' });
            isZipResult = true;

            el.pdfPageStat.style.display = 'none';
            el.pdfFileStat.style.display = '';
            el.pdfFileCountVal.textContent = images.length;
            el.pdfSize.textContent = formatSize(pdfBlob.size);
            el.pdfResultTitle.textContent = 'PDF fayllar tayyor!';
            el.pdfResultInfo.textContent = `${images.length} ta alohida PDF ZIP arxivda tayyor`;
            showToast('PDF fayllar tayyor!', 'success');
        } else {
            let pdf = null;

            for (let i = 0; i < images.length; i++) {
                el.convertBtnText.textContent = `Yaratilmoqda ${i + 1}/${images.length}`;
                await nextFrame();

                const jpeg = await imageToJpeg(images[i].url);
                const orientation = orientationOf(jpeg);
                if (!pdf) pdf = newPdf(orientation);
                else pdf.addPage('a4', orientation);
                placeOnPage(pdf, jpeg, orientation);
            }

            pdfBlob = pdf.output('blob');
            isZipResult = false;

            el.pdfPageStat.style.display = '';
            el.pdfFileStat.style.display = 'none';
            el.pdfPageCount.textContent = images.length;
            el.pdfSize.textContent = formatSize(pdfBlob.size);
            el.pdfResultTitle.textContent = 'PDF tayyor!';
            el.pdfResultInfo.textContent = 'Hujjatingiz muvaffaqiyatli yaratildi';
            showToast('PDF tayyor!', 'success');
        }

        updatePdfUI();
    } catch (err) {
        console.error(err);
        pdfBlob = null;
        showToast('PDF yaratishda xatolik yuz berdi. Rasmlarni tekshirib qayta urinib ko\'ring', 'error');
    } finally {
        setBusy(el.convertBtn, el.convertBtnText, false, convertLabel());
    }
}

function pdfFileName() {
    return isZipResult ? `2PDF-fayllar-${Date.now()}.zip` : `2PDF-${Date.now()}.pdf`;
}

function downloadPDF() {
    if (!pdfBlob) return;
    triggerDownload(pdfBlob, pdfFileName());
    showToast(isZipResult ? 'ZIP yuklab olindi' : 'PDF yuklab olindi', 'success');
}

async function sharePDF() {
    if (!pdfBlob) return;
    const status = await shareBlob(pdfBlob, pdfFileName(), isZipResult ? 'PDF fayllar' : 'PDF hujjat');
    if (status === 'shared') showToast('Ulashildi', 'success');
    else if (status === 'error') showToast('Ulashishda xatolik', 'error');
    else if (status === 'unsupported') showToast('Brauzeringiz ulashishni qo\'llab-quvvatlamaydi', 'error');
}

function goBack() {
    if (pdfBlob !== null) {
        pdfBlob = null;
        isZipResult = false;
        updatePdfUI();
    } else if (images.length > 0) {
        images.forEach((img) => URL.revokeObjectURL(img.url));
        images = [];
        el.previewGrid.innerHTML = '';
        separateMode = false;
        el.separateToggle.checked = false;
        updatePdfUI();
    }
}

// ===================================================
// ===== SIQISH (rasm) =====
// ===================================================
const COMPRESS_MAX_PIXELS = 16 * 1000 * 1000; // iOS Safari canvas chegarasi (~16.7 MP)
const Q_MIN = 10;
const Q_MAX = 95;

let compressFile = null;
let compressedBlob = null;
let currentQuality = 75;
let compressImg = null;        // yuklangan HTMLImageElement
let compressPreviewUrl = null;
const canvasCache = {};        // { jpeg: canvas, webp: canvas }
let estimateTimer = null;
let estimateToken = 0;

const cel = {
    uploadArea: $('compressUploadArea'),
    fileInput: $('compressFileInput'),
    uploadSection: $('compressUploadSection'),
    settingsSection: $('compressSettingsSection'),
    doneSection: $('compressDoneSection'),
    actionButtons: $('compressActionButtons'),
    doneButtons: $('compressDoneButtons'),
    backButton: $('compressBackButton'),
    previewImg: $('compressPreviewImg'),
    originalSize: $('compressOriginalSize'),
    estimatedSize: $('compressEstimatedSize'),
    qualitySlider: $('qualitySlider'),
    qualityValue: $('qualityValue'),
    savingLabel: $('savingLabel'),
    savingFill: $('savingFill'),
    compressBtn: $('compressBtn'),
    compressBtnText: $('compressBtnText'),
    beforeSize: $('compressBeforeSize'),
    afterSize: $('compressAfterSize'),
    savedPct: $('compressSavedPct')
};

setupDropzone(cel.uploadArea, cel.fileInput, (files) => handleCompressFile(files[0]));

function outputKind() {
    // PNG -> JPEG (PNG "sifat" bilan siqilmaydi), WebP -> WebP, qolganlari -> JPEG
    return compressFile && compressFile.type === 'image/webp' ? 'webp' : 'jpeg';
}

function getEncodeCanvas(kind) {
    if (canvasCache[kind]) return canvasCache[kind];

    let w = compressImg.naturalWidth;
    let h = compressImg.naturalHeight;
    const pixels = w * h;
    if (pixels > COMPRESS_MAX_PIXELS) {
        const k = Math.sqrt(COMPRESS_MAX_PIXELS / pixels);
        w = Math.floor(w * k);
        h = Math.floor(h * k);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (kind === 'jpeg') {
        ctx.fillStyle = '#ffffff'; // shaffof joylar qora bo'lib qolmasligi uchun
        ctx.fillRect(0, 0, w, h);
    }
    ctx.drawImage(compressImg, 0, 0, w, h);
    canvasCache[kind] = canvas;
    return canvas;
}

async function encodeCurrent(quality) {
    let kind = outputKind();
    let blob = await canvasToBlob(getEncodeCanvas(kind), `image/${kind}`, quality);
    // Ba'zi brauzerlar (masalan Safari) WebP kodlay olmaydi va PNG qaytaradi
    if (blob && kind === 'webp' && blob.type !== 'image/webp') {
        kind = 'jpeg';
        blob = await canvasToBlob(getEncodeCanvas('jpeg'), 'image/jpeg', quality);
    }
    if (!blob) throw new Error('Kodlash muvaffaqiyatsiz');
    return blob;
}

function resetCompressState() {
    clearTimeout(estimateTimer);
    estimateToken++;
    compressFile = null;
    compressedBlob = null;
    compressImg = null;
    Object.keys(canvasCache).forEach((k) => delete canvasCache[k]);
    if (compressPreviewUrl) URL.revokeObjectURL(compressPreviewUrl);
    compressPreviewUrl = null;
    cel.previewImg.removeAttribute('src');
}

async function handleCompressFile(file) {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
        showToast('Faqat JPG, PNG yoki WebP rasmlar qo\'llab-quvvatlanadi', 'error');
        return;
    }

    const url = URL.createObjectURL(file);
    let img;
    try {
        img = await loadImage(url);
    } catch (err) {
        URL.revokeObjectURL(url);
        showToast('Rasmni ochib bo\'lmadi', 'error');
        return;
    }

    resetCompressState();
    compressFile = file;
    compressImg = img;
    compressPreviewUrl = url;

    cel.previewImg.src = url;
    cel.originalSize.textContent = formatSize(file.size);
    updateCompressUI('settings');
    onQualityChange(currentQuality);

    if (img.naturalWidth * img.naturalHeight > COMPRESS_MAX_PIXELS) {
        showToast('Rasm juda katta bo\'lgani uchun o\'lchami biroz kichraytiriladi', 'warning');
    } else {
        showToast('Rasm yuklandi', 'success');
    }
}

function onQualityChange(val) {
    currentQuality = parseInt(val, 10);
    cel.qualityValue.textContent = currentQuality + '%';

    const fill = ((currentQuality - Q_MIN) / (Q_MAX - Q_MIN)) * 100;
    cel.qualitySlider.style.background =
        `linear-gradient(to right, var(--green) 0%, var(--green) ${fill}%, var(--border) ${fill}%, var(--border) 100%)`;

    const presets = document.querySelectorAll('.preset-btn');
    presets.forEach((b) => b.classList.remove('preset-active'));
    if (currentQuality <= 35) presets[0].classList.add('preset-active');
    else if (currentQuality >= 90) presets[2].classList.add('preset-active');
    else presets[1].classList.add('preset-active');

    scheduleEstimate();
}

function setQuality(val) {
    cel.qualitySlider.value = val;
    onQualityChange(val);
}

// Haqiqiy kodlash natijasi bo'yicha hajmni hisoblaydi (taxmin emas)
function scheduleEstimate() {
    if (!compressFile) return;
    cel.estimatedSize.textContent = '...';
    clearTimeout(estimateTimer);
    const token = ++estimateToken;
    estimateTimer = setTimeout(async () => {
        try {
            const blob = await encodeCurrent(currentQuality / 100);
            if (token !== estimateToken || !compressFile) return;
            showEstimate(blob.size);
        } catch (err) {
            if (token === estimateToken) cel.estimatedSize.textContent = '—';
        }
    }, 220);
}

function showEstimate(newSize) {
    const original = compressFile.size;
    const size = Math.min(newSize, original);
    const saved = original - size;
    const pct = Math.max(0, Math.round((saved / original) * 100));

    cel.estimatedSize.textContent = newSize >= original ? formatSize(original) : formatSize(newSize);
    cel.savingLabel.textContent = newSize >= original ? 'Hajm kamaymaydi' : `${pct}% (${formatSize(saved)})`;
    cel.savingFill.style.width = pct + '%';
}

async function doCompress() {
    if (!compressFile) return;

    setBusy(cel.compressBtn, cel.compressBtnText, true, 'Siqilmoqda...');
    clearTimeout(estimateTimer);
    estimateToken++;

    try {
        await nextFrame();
        const blob = await encodeCurrent(currentQuality / 100);

        if (blob.size >= compressFile.size) {
            // Siqish hajmni oshirib yuborsa, asl faylni saqlaymiz
            compressedBlob = compressFile.slice(0, compressFile.size, compressFile.type);
            showToast('Rasm allaqachon optimallashgan, hajmi kamaymadi', 'info');
        } else {
            compressedBlob = blob;
            showToast('Rasm siqildi!', 'success');
        }

        const saved = Math.max(0, compressFile.size - compressedBlob.size);
        cel.beforeSize.textContent = formatSize(compressFile.size);
        cel.afterSize.textContent = formatSize(compressedBlob.size);
        cel.savedPct.textContent = Math.round((saved / compressFile.size) * 100) + '%';
        updateCompressUI('done');
    } catch (err) {
        console.error(err);
        showToast('Siqishda xatolik yuz berdi', 'error');
    } finally {
        setBusy(cel.compressBtn, cel.compressBtnText, false, 'Siqish');
    }
}

function updateCompressUI(state) {
    if (state === 'upload') {
        cel.uploadSection.classList.remove('hidden');
        cel.settingsSection.style.display = 'none';
        cel.doneSection.style.display = 'none';
        cel.actionButtons.classList.add('hidden');
        cel.doneButtons.classList.add('hidden');
        cel.backButton.classList.add('hidden');
    } else if (state === 'settings') {
        cel.uploadSection.classList.add('hidden');
        cel.settingsSection.style.display = 'block';
        cel.doneSection.style.display = 'none';
        cel.actionButtons.classList.remove('hidden');
        cel.doneButtons.classList.add('hidden');
        cel.backButton.classList.remove('hidden');
    } else if (state === 'done') {
        cel.uploadSection.classList.add('hidden');
        cel.settingsSection.style.display = 'none';
        cel.doneSection.style.display = 'block';
        cel.actionButtons.classList.add('hidden');
        cel.doneButtons.classList.remove('hidden');
        cel.backButton.classList.remove('hidden');
    }
}

function goBackCompress() {
    if (compressedBlob !== null) {
        compressedBlob = null;
        updateCompressUI('settings');
        scheduleEstimate();
    } else if (compressFile !== null) {
        resetCompressState();
        updateCompressUI('upload');
    }
}

function compressedFileName() {
    const type = compressedBlob.type;
    const ext = type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : 'jpg';
    return `siqilgan-${baseName(compressFile.name, 'rasm')}.${ext}`;
}

function downloadCompressed() {
    if (!compressedBlob) return;
    triggerDownload(compressedBlob, compressedFileName());
    showToast('Rasm yuklab olindi', 'success');
}

async function shareCompressed() {
    if (!compressedBlob) return;
    const status = await shareBlob(compressedBlob, compressedFileName(), 'Siqilgan rasm');
    if (status === 'shared') showToast('Rasm ulashildi', 'success');
    else if (status === 'error') showToast('Ulashishda xatolik', 'error');
    else if (status === 'unsupported') showToast('Brauzeringiz ulashishni qo\'llab-quvvatlamaydi', 'error');
}

// ===================================================
// ===== BIRLASHTIRISH (PDF merge) =====
// ===================================================
const MAX_PDF_FILES = 15;

let mergeFiles = [];  // { id, file, name }
let mergedBlob = null;

const mel = {
    uploadArea: $('mergeUploadArea'),
    fileInput: $('mergeFileInput'),
    uploadSection: $('mergeUploadSection'),
    previewSection: $('mergePreviewSection'),
    doneSection: $('mergeDoneSection'),
    mergeList: $('mergeList'),
    fileCount: $('pdfFileCount'),
    addBtn: $('mergeAddBtn'),
    actionButtons: $('mergeActionButtons'),
    doneButtons: $('mergeDoneButtons'),
    backButton: $('mergeBackButton'),
    mergeBtn: $('mergeBtn'),
    mergeBtnText: $('mergeBtnText'),
    mergedPageCount: $('mergedPageCount'),
    mergedFileCount: $('mergedFileCount'),
    mergedSize: $('mergedSize')
};

setupDropzone(mel.uploadArea, mel.fileInput, handleMergeFiles);
mel.addBtn.addEventListener('click', () => mel.fileInput.click());

function isPdf(file) {
    return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function handleMergeFiles(files) {
    if (!files.length) return;

    const validPDFs = files.filter(isPdf);
    if (validPDFs.length !== files.length) {
        showToast('Faqat PDF fayllari qo\'llab-quvvatlanadi', 'error');
    }
    if (validPDFs.length === 0) return;

    const room = MAX_PDF_FILES - mergeFiles.length;
    if (room <= 0) {
        showToast(`Eng ko'pi bilan ${MAX_PDF_FILES} ta fayl qo'shish mumkin`, 'warning');
        return;
    }
    const toAdd = validPDFs.slice(0, room);
    if (toAdd.length < validPDFs.length) {
        showToast(`Faqat ${MAX_PDF_FILES} ta faylgacha qabul qilinadi`, 'warning');
    }

    const firstNew = mergeFiles.length;
    toAdd.forEach((file) => mergeFiles.push({ id: uid(), file, name: file.name }));
    renderMergeList(firstNew);
    updateMergeUI();
    if (toAdd.length === validPDFs.length) showToast(`${toAdd.length} ta PDF yuklandi`, 'success');
}

function renderMergeList(animateFrom = mergeFiles.length) {
    mel.mergeList.innerHTML = '';

    mergeFiles.forEach((pdfData, i) => {
        const item = document.createElement('div');
        item.className = 'merge-item' + (i >= animateFrom ? ' enter' : '');
        if (i >= animateFrom) item.style.animationDelay = `${Math.min(i - animateFrom, 8) * 0.03}s`;

        const num = document.createElement('span');
        num.className = 'merge-item-num';
        num.textContent = i + 1;

        const icon = document.createElement('div');
        icon.className = 'merge-item-icon';
        icon.innerHTML = SVG.file;

        const info = document.createElement('div');
        info.className = 'merge-item-info';
        const name = document.createElement('div');
        name.className = 'merge-item-name';
        name.textContent = pdfData.name;
        name.title = pdfData.name;
        const size = document.createElement('div');
        size.className = 'merge-item-size';
        size.textContent = formatSize(pdfData.file.size);
        info.append(name, size);

        const actions = document.createElement('div');
        actions.className = 'merge-item-actions';
        const up = iconButton('merge-move-btn', 'Yuqoriga', SVG.up, () => moveMergePDF(pdfData.id, -1));
        const down = iconButton('merge-move-btn', 'Pastga', SVG.down, () => moveMergePDF(pdfData.id, 1));
        up.disabled = i === 0;
        down.disabled = i === mergeFiles.length - 1;
        const remove = iconButton('merge-remove-btn', 'PDFni o\'chirish', SVG.x, () => removeMergePDF(pdfData.id));
        actions.append(up, down, remove);

        item.append(num, icon, info, actions);
        mel.mergeList.appendChild(item);
    });
}

function moveMergePDF(id, dir) {
    const i = mergeFiles.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= mergeFiles.length) return;
    [mergeFiles[i], mergeFiles[j]] = [mergeFiles[j], mergeFiles[i]];
    renderMergeList();
}

function removeMergePDF(id) {
    mergeFiles = mergeFiles.filter((f) => f.id !== id);
    renderMergeList();
    updateMergeUI();
    showToast('PDF o\'chirildi', 'info');
}

function updateMergeUI() {
    const hasFiles = mergeFiles.length > 0;
    const hasMerged = mergedBlob !== null;

    if (hasMerged) {
        mel.uploadSection.classList.add('hidden');
        mel.previewSection.style.display = 'none';
        mel.doneSection.style.display = 'block';
        mel.actionButtons.classList.add('hidden');
        mel.doneButtons.classList.remove('hidden');
        mel.backButton.classList.remove('hidden');
    } else if (hasFiles) {
        mel.uploadSection.classList.add('hidden');
        mel.previewSection.style.display = 'block';
        mel.doneSection.style.display = 'none';
        mel.actionButtons.classList.remove('hidden');
        mel.doneButtons.classList.add('hidden');
        mel.fileCount.textContent = `${mergeFiles.length} ta fayl`;
        mel.addBtn.disabled = mergeFiles.length >= MAX_PDF_FILES;
        mel.backButton.classList.remove('hidden');
    } else {
        mel.uploadSection.classList.remove('hidden');
        mel.previewSection.style.display = 'none';
        mel.doneSection.style.display = 'none';
        mel.actionButtons.classList.add('hidden');
        mel.doneButtons.classList.add('hidden');
        mel.backButton.classList.add('hidden');
    }
}

// PDF larni haqiqiy birlashtiradi (pdf-lib): matn, vektor va sahifa o'lchamlari saqlanadi
async function doMerge() {
    if (mergeFiles.length === 0) return;
    if (mergeFiles.length < 2) {
        showToast('Birlashtirish uchun kamida 2 ta PDF kerak', 'warning');
        return;
    }
    if (!requireLib('pdf-lib', window.PDFLib && window.PDFLib.PDFDocument)) return;

    setBusy(mel.mergeBtn, mel.mergeBtnText, true, 'Birlashtirilmoqda...');

    try {
        const { PDFDocument } = window.PDFLib;
        const merged = await PDFDocument.create();
        let totalPages = 0;

        for (let i = 0; i < mergeFiles.length; i++) {
            const item = mergeFiles[i];
            mel.mergeBtnText.textContent = `Birlashtirilmoqda ${i + 1}/${mergeFiles.length}`;
            await nextFrame();

            let src;
            try {
                const bytes = await item.file.arrayBuffer();
                src = await PDFDocument.load(bytes);
            } catch (err) {
                console.error(err);
                const msg = /encrypt/i.test(String(err && err.message))
                    ? `"${item.name}" parol bilan himoyalangan`
                    : `"${item.name}" faylini o'qib bo'lmadi (buzilgan bo'lishi mumkin)`;
                showToast(msg, 'error');
                return;
            }

            const pages = await merged.copyPages(src, src.getPageIndices());
            pages.forEach((page) => merged.addPage(page));
            totalPages += pages.length;
        }

        const bytes = await merged.save();
        mergedBlob = new Blob([bytes], { type: 'application/pdf' });

        mel.mergedPageCount.textContent = totalPages;
        mel.mergedFileCount.textContent = mergeFiles.length;
        mel.mergedSize.textContent = formatSize(mergedBlob.size);

        showToast('PDF tayyor!', 'success');
        updateMergeUI();
    } catch (err) {
        console.error(err);
        mergedBlob = null;
        showToast('Birlashtirishda xatolik yuz berdi', 'error');
    } finally {
        setBusy(mel.mergeBtn, mel.mergeBtnText, false, 'Birlashtirish');
    }
}

function downloadMerged() {
    if (!mergedBlob) return;
    triggerDownload(mergedBlob, `birlashtirilgan-${Date.now()}.pdf`);
    showToast('PDF yuklab olindi', 'success');
}

function goBackMerge() {
    if (mergedBlob !== null) {
        mergedBlob = null;
        updateMergeUI();
    } else if (mergeFiles.length > 0) {
        mergeFiles = [];
        mel.mergeList.innerHTML = '';
        updateMergeUI();
    }
}

// Boshlang'ich holat
onQualityChange(75);
