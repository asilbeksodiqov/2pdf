// ===================================================
// ===== VIDEO COMPRESS (FFmpeg.wasm) =====
// ===================================================
// Bu fayl mustaqil ES module sifatida ulanadi (index.html da
// <script type="module" src="video-compress.js">). Shu sabab bu yerdagi
// funksiyalarni HTML dagi onclick="..." dan chaqira olish uchun ularni
// aniq ravishda window ob'ektiga bog'laymiz.

import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm';
import { fetchFile, toBlobURL } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/+esm';

const FFMPEG_CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

let ffmpeg = null;
let ffmpegLoaded = false;
let ffmpegLoadingPromise = null;

let videoFile = null;
let videoCompressedBlob = null;
let videoCurrentQuality = 75;
let videoPreviewUrl = null;

const vel = {
    uploadArea: document.getElementById('compressVideoUploadArea'),
    fileInput: document.getElementById('compressVideoFileInput'),
    uploadSection: document.getElementById('compressVideoUploadSection'),
    settingsSection: document.getElementById('compressVideoSettingsSection'),
    doneSection: document.getElementById('compressVideoDoneSection'),
    actionButtons: document.getElementById('videoActionButtons'),
    doneButtons: document.getElementById('videoDoneButtons'),
    backButton: document.getElementById('compressBackButton'),
    preview: document.getElementById('compressVideoPreview'),
    originalSize: document.getElementById('compressVideoOriginalSize'),
    qualityLabelBox: document.getElementById('compressVideoQualityLabel'),
    qualitySlider: document.getElementById('videoQualitySlider'),
    qualityValue: document.getElementById('videoQualityValue'),
    compressBtn: document.getElementById('videoCompressBtn'),
    compressBtnText: document.getElementById('videoCompressBtnText'),
    beforeSize: document.getElementById('compressVideoBeforeSize'),
    afterSize: document.getElementById('compressVideoAfterSize'),
    savedPct: document.getElementById('compressVideoSavedPct'),
    progressCard: document.getElementById('videoProgressCard'),
    progressLabel: document.getElementById('videoProgressLabel'),
    progressValue: document.getElementById('videoProgressValue'),
    progressFill: document.getElementById('videoProgressFill')
};

vel.fileInput.addEventListener('change', handleVideoFile);

vel.uploadArea.addEventListener('click', (e) => {
    if (e.target === vel.uploadArea || e.target.closest('.upload-icon-wrapper') || e.target.closest('.upload-title') || e.target.closest('.upload-subtitle')) {
        vel.fileInput.click();
    }
});

vel.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    vel.uploadArea.classList.add('dragover');
});

vel.uploadArea.addEventListener('dragleave', () => vel.uploadArea.classList.remove('dragover'));

vel.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    vel.uploadArea.classList.remove('dragover');
    vel.fileInput.files = e.dataTransfer.files;
    handleVideoFile();
});

function handleVideoFile() {
    const file = vel.fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
        showToast('Faqat video fayllari qo\'llab-quvvatlanadi', 'error');
        return;
    }

    videoFile = file;
    videoCompressedBlob = null;

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    videoPreviewUrl = URL.createObjectURL(file);
    vel.preview.src = videoPreviewUrl;

    vel.originalSize.textContent = formatSize(file.size);
    updateVideoCompressUI('settings');
    onVideoQualityChange(vel.qualitySlider.value);

    showToast('Video yuklandi', 'success');
}

function onVideoQualityChange(val) {
    videoCurrentQuality = parseInt(val);
    vel.qualityValue.textContent = val + '%';
    vel.qualityLabelBox.textContent = val + '%';

    vel.qualitySlider.style.background = `linear-gradient(to right, var(--green) 0%, var(--green) ${val}%, var(--border) ${val}%, var(--border) 100%)`;

    const presetBtns = vel.settingsSection.querySelectorAll('.preset-btn');
    presetBtns.forEach(b => b.classList.remove('preset-active'));
    if (videoCurrentQuality <= 35) presetBtns[0].classList.add('preset-active');
    else if (videoCurrentQuality >= 90) presetBtns[2].classList.add('preset-active');
    else presetBtns[1].classList.add('preset-active');
}

function setVideoQuality(val) {
    vel.qualitySlider.value = val;
    onVideoQualityChange(val);
}

// Sifat foizini (10-95) FFmpeg CRF qiymatiga aylantiradi.
// Yuqori foiz -> past CRF (yaxshiroq sifat), past foiz -> yuqori CRF (kichikroq hajm).
function qualityToCrf(q) {
    const minCrf = 18;
    const maxCrf = 34;
    const ratio = (95 - q) / (95 - 10);
    return Math.round(minCrf + ratio * (maxCrf - minCrf));
}

function getExt(name) {
    const parts = (name || '').split('.');
    if (parts.length > 1) return '.' + parts.pop().toLowerCase();
    return '.mp4';
}

function showVideoProgress(show, label, pct) {
    vel.progressCard.classList.toggle('active', !!show);
    if (label !== undefined) vel.progressLabel.textContent = label;
    if (pct !== undefined) {
        vel.progressValue.textContent = pct + '%';
        vel.progressFill.style.width = pct + '%';
    }
}

async function ensureFFmpegLoaded() {
    if (ffmpegLoaded) return;
    if (ffmpegLoadingPromise) return ffmpegLoadingPromise;

    ffmpegLoadingPromise = (async () => {
        ffmpeg = ffmpeg || new FFmpeg();

        ffmpeg.on('progress', ({ progress }) => {
            const pct = Math.min(100, Math.max(0, Math.round((progress || 0) * 100)));
            showVideoProgress(true, 'Siqilmoqda...', pct);
        });

        await ffmpeg.load({
            coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, 'application/wasm')
        });

        ffmpegLoaded = true;
    })();

    return ffmpegLoadingPromise;
}

async function doVideoCompress() {
    if (!videoFile) return;

    vel.compressBtn.disabled = true;
    vel.compressBtnText.textContent = 'Siqilmoqda...';

    try {
        if (!ffmpegLoaded) {
            showVideoProgress(true, 'FFmpeg yuklanmoqda...', 0);
            showToast('FFmpeg yuklanmoqda, biroz kuting...', 'info');
            await ensureFFmpegLoaded();
        }

        showVideoProgress(true, 'Siqilmoqda...', 0);
        showToast('Video siqilmoqda...', 'info');

        const inputName = 'input' + getExt(videoFile.name);
        const crf = qualityToCrf(videoCurrentQuality);

        await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

        await ffmpeg.exec([
            '-i', inputName,
            '-c:v', 'libx264',
            '-crf', String(crf),
            '-preset', 'veryfast',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            'output.mp4'
        ]);

        const data = await ffmpeg.readFile('output.mp4');
        videoCompressedBlob = new Blob([data.buffer], { type: 'video/mp4' });

        try {
            await ffmpeg.deleteFile(inputName);
            await ffmpeg.deleteFile('output.mp4');
        } catch (cleanupErr) {
            // faylni tozalab bo'lmasa ham davom etaveramiz
        }

        const beforeSize = formatSize(videoFile.size);
        const afterSize = formatSize(videoCompressedBlob.size);
        const savedPct = Math.round(((videoFile.size - videoCompressedBlob.size) / videoFile.size) * 100);

        vel.beforeSize.textContent = beforeSize;
        vel.afterSize.textContent = afterSize;
        vel.savedPct.textContent = (savedPct > 0 ? savedPct : 0) + '%';

        showToast('Video siqildi!', 'success');
        updateVideoCompressUI('done');
    } catch (err) {
        console.error(err);
        showToast('Xatolik yuz berdi', 'error');
    } finally {
        vel.compressBtn.disabled = false;
        vel.compressBtnText.textContent = 'Siqish';
        showVideoProgress(false);
    }
}

function updateVideoCompressUI(state) {
    const upload = vel.uploadSection;
    const settings = vel.settingsSection;
    const done = vel.doneSection;
    const actionBtns = vel.actionButtons;
    const doneBtns = vel.doneButtons;
    const backBtn = vel.backButton;

    if (state === 'upload') {
        upload.classList.remove('hidden');
        settings.style.display = 'none';
        done.style.display = 'none';
        actionBtns.classList.add('hidden');
        doneBtns.classList.add('hidden');
        backBtn.classList.add('hidden');
    } else if (state === 'settings') {
        upload.classList.add('hidden');
        settings.style.display = 'block';
        done.style.display = 'none';
        actionBtns.classList.remove('hidden');
        doneBtns.classList.add('hidden');
        backBtn.classList.remove('hidden');
    } else if (state === 'done') {
        upload.classList.add('hidden');
        settings.style.display = 'none';
        done.style.display = 'block';
        actionBtns.classList.add('hidden');
        doneBtns.classList.remove('hidden');
        backBtn.classList.remove('hidden');
    }
}

// script.js dagi switchCompressTab() video tab'iga o'tilganda shu funksiyani
// chaqirib, orqaga tugmasi va action buttonlarni joriy holatga moslaydi.
function syncVideoCompressUI() {
    if (videoCompressedBlob !== null) updateVideoCompressUI('done');
    else if (videoFile !== null) updateVideoCompressUI('settings');
    else updateVideoCompressUI('upload');
}

// script.js dagi goBackCompress() video tab faol bo'lganda shu funksiyani chaqiradi.
function goBackVideoCompress() {
    if (videoCompressedBlob !== null) {
        videoCompressedBlob = null;
        updateVideoCompressUI('settings');
    } else if (videoFile !== null) {
        videoFile = null;
        vel.fileInput.value = '';
        if (videoPreviewUrl) {
            URL.revokeObjectURL(videoPreviewUrl);
            videoPreviewUrl = null;
        }
        vel.preview.src = '';
        updateVideoCompressUI('upload');
    }
}

function downloadCompressedVideo() {
    if (!videoCompressedBlob) return;
    const url = URL.createObjectURL(videoCompressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Video yuklab olindi', 'success');
}

async function shareCompressedVideo() {
    if (!videoCompressedBlob) return;
    const file = new File([videoCompressedBlob], `compressed-${Date.now()}.mp4`, { type: videoCompressedBlob.type });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'Siqilgan video' });
            showToast('Video ulashildi', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Ulashishda xatolik', 'error');
        }
    } else {
        showToast('Brauzeringiz ulashishni qo\'llab-quvvatlamaydi', 'error');
    }
}

// HTML dagi onclick="..." atributlari uchun global (window) ga bog'laymiz,
// chunki bu module script — ichidagi funksiyalar avtomatik global bo'lmaydi.
window.onVideoQualityChange = onVideoQualityChange;
window.setVideoQuality = setVideoQuality;
window.doVideoCompress = doVideoCompress;
window.downloadCompressedVideo = downloadCompressedVideo;
window.shareCompressedVideo = shareCompressedVideo;
window.goBackVideoCompress = goBackVideoCompress;
window.syncVideoCompressUI = syncVideoCompressUI;
