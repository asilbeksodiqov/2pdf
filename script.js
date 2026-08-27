const { jsPDF } = window.jspdf;
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ===== PAGE NAVIGATION =====
function switchPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById('page-' + page).classList.add('active');
    document.getElementById('nav-' + page).classList.add('active');
}

// ===== TOAST =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastText = toast.querySelector('.toast-text');
    const toastIcon = toast.querySelector('.toast-icon');

    const icons = {
        success: 'M5 13l4 4L19 7',
        error: 'M6 18L18 6M6 6l12 12',
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    };

    toastIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icons[type] || icons.info}"></path>`;
    toast.className = `toast ${type}`;
    toastText.textContent = message;
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===================================================
// ===== 2PDF =====
// ===================================================
let images = [];
let pdfBlob = null;
let separateMode = false;
let isZipResult = false;

const el = {
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadSection: document.getElementById('uploadSection'),
    previewSection: document.getElementById('previewSection'),
    pdfPreviewSection: document.getElementById('pdfPreviewSection'),
    previewGrid: document.getElementById('previewGrid'),
    imageCount: document.getElementById('imageCount'),
    actionButtons: document.getElementById('actionButtons'),
    pdfButtons: document.getElementById('pdfButtons'),
    convertBtn: document.getElementById('convertBtn'),
    convertBtnText: document.getElementById('convertBtnText'),
    pdfPageCount: document.getElementById('pdfPageCount'),
    pdfSize: document.getElementById('pdfSize'),
    backButton: document.getElementById('backButton'),
    separateToggleCard: document.getElementById('separateToggleCard'),
    separateToggle: document.getElementById('separateToggle'),
    pdfResultTitle: document.getElementById('pdfResultTitle'),
    pdfResultInfo: document.getElementById('pdfResultInfo'),
    pdfPageStat: document.getElementById('pdfPageStat'),
    pdfFileStat: document.getElementById('pdfFileStat'),
    pdfFileCountVal: document.getElementById('pdfFileCountVal')
};

el.separateToggle.addEventListener('change', () => {
    separateMode = el.separateToggle.checked;
    el.convertBtnText.textContent = (separateMode && images.length > 1) ? 'PDF larni yaratish' : 'PDF yaratish';
});

el.fileInput.addEventListener('change', handleFiles);

el.uploadArea.addEventListener('click', (e) => {
    if (e.target === el.uploadArea || e.target.closest('.upload-icon-wrapper') || e.target.closest('.upload-title') || e.target.closest('.upload-subtitle')) {
        el.fileInput.click();
    }
});

el.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    el.uploadArea.classList.add('dragover');
});

el.uploadArea.addEventListener('dragleave', () => el.uploadArea.classList.remove('dragover'));

el.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    el.uploadArea.classList.remove('dragover');
    el.fileInput.files = e.dataTransfer.files;
    handleFiles();
});

function handleFiles() {
    const files = Array.from(el.fileInput.files);
    const validImages = files.filter(f => f.type.startsWith('image/'));

    if (validImages.length !== files.length) {
        showToast('Faqat rasm fayllari qo\'llab-quvvatlanadi', 'error');
    }

    if (validImages.length === 0) return;

    validImages.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = {
                id: Math.random().toString(36).substr(2, 9),
                file,
                preview: e.target.result,
                name: file.name
            };
            images.push(imageData);
            addImagePreview(imageData);
            updatePdfUI();
        };
        reader.readAsDataURL(file);
    });

    showToast(`${validImages.length} ta rasm yuklandi`, 'success');
}

function addImagePreview(imageData) {
    const existing = document.getElementById('addMoreBtn');
    if (existing) existing.remove();

    const item = document.createElement('div');
    item.className = 'preview-item';
    item.style.animationDelay = `${images.length * 0.05}s`;
    item.innerHTML = `
        <img src="${imageData.preview}" alt="${imageData.name}">
        <div class="preview-overlay"></div>
        <button class="remove-button" onclick="removeImage('${imageData.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    el.previewGrid.appendChild(item);

    const addMoreBtn = document.createElement('div');
    addMoreBtn.id = 'addMoreBtn';
    addMoreBtn.className = 'add-more-button';
    addMoreBtn.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>`;
    addMoreBtn.onclick = () => el.fileInput.click();
    el.previewGrid.insertBefore(addMoreBtn, el.previewGrid.firstChild);
}

function removeImage(id) {
    images = images.filter(img => img.id !== id);
    el.previewGrid.innerHTML = '';
    images.forEach(img => addImagePreview(img));
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
        el.convertBtnText.textContent = (separateMode && images.length > 1) ? 'PDF larni yaratish' : 'PDF yaratish';
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

function fitImageToPage(pdf, img) {
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();
    const ir = img.width / img.height;
    const pr = pw / ph;

    let fw, fh;
    if (ir > pr) { fw = pw - 20; fh = fw / ir; }
    else { fh = ph - 20; fw = fh * ir; }

    return { pw, ph, fw, fh };
}

async function convertToPDF() {
    if (images.length === 0) return;

    const useSeparate = separateMode && images.length > 1;

    el.convertBtn.disabled = true;
    el.convertBtnText.textContent = 'Yuklanmoqda...';
    showToast(useSeparate ? 'PDF fayllar yaratilmoqda...' : 'PDF yaratilmoqda...', 'info');

    try {
        if (useSeparate) {
            const zip = new JSZip();
            let idx = 1;

            for (const imageData of images) {
                const pdf = new jsPDF();
                const img = new Image();
                await new Promise(resolve => { img.onload = resolve; img.src = imageData.preview; });

                const { pw, ph, fw, fh } = fitImageToPage(pdf, img);
                pdf.addImage(imageData.preview, 'JPEG', (pw - fw) / 2, (ph - fh) / 2, fw, fh);

                const singleBlob = pdf.output('blob');
                const baseName = (imageData.name || `rasm-${idx}`).replace(/\.[^/.]+$/, '');
                zip.file(`${String(idx).padStart(2, '0')}-${baseName}.pdf`, singleBlob);
                idx++;
            }

            pdfBlob = await zip.generateAsync({ type: 'blob' });
            isZipResult = true;

            el.pdfPageStat.style.display = 'none';
            el.pdfFileStat.style.display = '';
            el.pdfFileCountVal.textContent = images.length;
            el.pdfSize.textContent = (pdfBlob.size / 1024).toFixed(1) + ' KB';
            el.pdfResultTitle.textContent = 'PDF fayllar tayyor!';
            el.pdfResultInfo.textContent = `${images.length} ta alohida PDF ZIP arxivda tayyor`;
            showToast('PDF fayllar tayyor!', 'success');
        } else {
            const pdf = new jsPDF();
            let isFirstPage = true;

            for (const imageData of images) {
                if (!isFirstPage) pdf.addPage();
                isFirstPage = false;

                const img = new Image();
                await new Promise(resolve => { img.onload = resolve; img.src = imageData.preview; });

                const { pw, ph, fw, fh } = fitImageToPage(pdf, img);
                pdf.addImage(imageData.preview, 'JPEG', (pw - fw) / 2, (ph - fh) / 2, fw, fh);
            }

            pdfBlob = pdf.output('blob');
            isZipResult = false;

            el.pdfPageStat.style.display = '';
            el.pdfFileStat.style.display = 'none';
            el.pdfPageCount.textContent = images.length;
            el.pdfSize.textContent = (pdfBlob.size / 1024).toFixed(1) + ' KB';
            el.pdfResultTitle.textContent = 'PDF tayyor!';
            el.pdfResultInfo.textContent = 'Hujjatingiz muvaffaqiyatli yaratildi';
            showToast('PDF tayyor!', 'success');
        }

        updatePdfUI();
    } catch (err) {
        showToast('Xatolik yuz berdi', 'error');
        console.error(err);
    } finally {
        el.convertBtn.disabled = false;
        el.convertBtnText.textContent = (separateMode && images.length > 1) ? 'PDF larni yaratish' : 'PDF yaratish';
    }
}

function downloadPDF() {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isZipResult ? `2PDF-fayllar-${Date.now()}.zip` : `2PDF-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(isZipResult ? 'ZIP yuklab olindi' : 'PDF yuklab olindi', 'success');
}

async function sharePDF() {
    if (!pdfBlob) return;
    const fileName = isZipResult ? `2PDF-fayllar-${Date.now()}.zip` : `2PDF-${Date.now()}.pdf`;
    const fileType = isZipResult ? 'application/zip' : 'application/pdf';
    const file = new File([pdfBlob], fileName, { type: fileType });
    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: isZipResult ? 'PDF fayllar' : 'PDF Hujjat',
                text: isZipResult ? 'Rasmlardan yaratilgan PDF fayllar' : 'Rasmlardan yaratilgan PDF'
            });
            showToast(isZipResult ? 'ZIP ulashildi' : 'PDF ulashildi', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Ulashishda xatolik', 'error');
        }
    } else {
        showToast('Brauzeringiz ulashishni qo\'llab-quvvatlamaydi', 'error');
    }
}

function goBack() {
    if (pdfBlob !== null) {
        pdfBlob = null;
        isZipResult = false;
        updatePdfUI();
    } else if (images.length > 0) {
        images = [];
        el.previewGrid.innerHTML = '';
        separateMode = false;
        el.separateToggle.checked = false;
        updatePdfUI();
    }
}

// ===================================================
// ===== COMPRESS =====
// ===================================================
let compressFile = null;
let compressedBlob = null;
let currentQuality = 75;

const cel = {
    uploadArea: document.getElementById('compressUploadArea'),
    fileInput: document.getElementById('compressFileInput'),
    uploadSection: document.getElementById('compressUploadSection'),
    settingsSection: document.getElementById('compressSettingsSection'),
    doneSection: document.getElementById('compressDoneSection'),
    actionButtons: document.getElementById('compressActionButtons'),
    doneButtons: document.getElementById('compressDoneButtons'),
    backButton: document.getElementById('compressBackButton'),
    previewImg: document.getElementById('compressPreviewImg'),
    originalSize: document.getElementById('compressOriginalSize'),
    estimatedSize: document.getElementById('compressEstimatedSize'),
    qualitySlider: document.getElementById('qualitySlider'),
    qualityValue: document.getElementById('qualityValue'),
    savingLabel: document.getElementById('savingLabel'),
    savingFill: document.getElementById('savingFill'),
    compressBtn: document.getElementById('compressBtn'),
    compressBtnText: document.getElementById('compressBtnText'),
    beforeSize: document.getElementById('compressBeforeSize'),
    afterSize: document.getElementById('compressAfterSize'),
    savedPct: document.getElementById('compressSavedPct')
};

cel.fileInput.addEventListener('change', handleCompressFile);

cel.uploadArea.addEventListener('click', (e) => {
    if (e.target === cel.uploadArea || e.target.closest('.upload-icon-wrapper') || e.target.closest('.upload-title') || e.target.closest('.upload-subtitle')) {
        cel.fileInput.click();
    }
});

cel.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    cel.uploadArea.classList.add('dragover');
});

cel.uploadArea.addEventListener('dragleave', () => cel.uploadArea.classList.remove('dragover'));

cel.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    cel.uploadArea.classList.remove('dragover');
    cel.fileInput.files = e.dataTransfer.files;
    handleCompressFile();
});

function handleCompressFile() {
    const file = cel.fileInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showToast('Faqat rasm fayllari qo\'llab-quvvatlanadi', 'error');
        return;
    }

    compressFile = file;
    compressedBlob = null;

    const reader = new FileReader();
    reader.onload = (e) => {
        cel.previewImg.src = e.target.result;
        cel.originalSize.textContent = formatSize(file.size);
        updateCompressUI('settings');
        updateEstimatedSize();
    };
    reader.readAsDataURL(file);

    showToast('Rasm yuklandi', 'success');
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function onQualityChange(val) {
    currentQuality = parseInt(val);
    cel.qualityValue.textContent = val + '%';

    cel.qualitySlider.style.background = `linear-gradient(to right, var(--green) 0%, var(--green) ${val}%, var(--border) ${val}%, var(--border) 100%)`;

    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('preset-active'));
    if (currentQuality <= 35) document.querySelectorAll('.preset-btn')[0].classList.add('preset-active');
    else if (currentQuality >= 90) document.querySelectorAll('.preset-btn')[2].classList.add('preset-active');
    else document.querySelectorAll('.preset-btn')[1].classList.add('preset-active');

    updateEstimatedSize();
}

function setQuality(val) {
    cel.qualitySlider.value = val;
    onQualityChange(val);
}

function updateEstimatedSize() {
    if (!compressFile) return;
    const ratio = (currentQuality / 100);
    const estimatedBytes = Math.round(compressFile.size * Math.pow(ratio, 1.4));
    const saved = compressFile.size - estimatedBytes;
    const savedPct = Math.round((saved / compressFile.size) * 100);

    cel.estimatedSize.textContent = formatSize(estimatedBytes);
    cel.savingLabel.textContent = `${savedPct > 0 ? savedPct : 0}% (${formatSize(Math.max(saved, 0))})`;
    cel.savingFill.style.width = Math.max(savedPct, 0) + '%';
}

async function doCompress() {
    if (!compressFile) return;

    cel.compressBtn.disabled = true;
    cel.compressBtnText.textContent = 'Siqilmoqda...';
    showToast('Siqilmoqda...', 'info');

    try {
        const img = new Image();
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(compressFile);
        });

        await new Promise(resolve => { img.onload = resolve; img.src = dataUrl; });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const mimeType = compressFile.type === 'image/png' ? 'image/jpeg' : compressFile.type || 'image/jpeg';
        const quality = currentQuality / 100;

        const blob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality));

        compressedBlob = blob;

        const beforeSize = formatSize(compressFile.size);
        const afterSize = formatSize(blob.size);
        const savedPct = Math.round(((compressFile.size - blob.size) / compressFile.size) * 100);

        cel.beforeSize.textContent = beforeSize;
        cel.afterSize.textContent = afterSize;
        cel.savedPct.textContent = savedPct + '%';

        showToast('Compress tayyor!', 'success');
        updateCompressUI('done');
    } catch (err) {
        showToast('Xatolik yuz berdi', 'error');
        console.error(err);
    } finally {
        cel.compressBtn.disabled = false;
        cel.compressBtnText.textContent = 'Siqish';
    }
}

function updateCompressUI(state) {
    const upload = cel.uploadSection;
    const settings = cel.settingsSection;
    const done = cel.doneSection;
    const actionBtns = cel.actionButtons;
    const doneBtns = cel.doneButtons;
    const backBtn = cel.backButton;

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

function goBackCompress() {
    if (activeCompressTab === 'video') {
        if (typeof goBackVideoCompress === 'function') goBackVideoCompress();
        return;
    }
    if (compressedBlob !== null) {
        compressedBlob = null;
        updateCompressUI('settings');
    } else if (compressFile !== null) {
        compressFile = null;
        cel.fileInput.value = '';
        updateCompressUI('upload');
    }
}

// ===== COMPRESS TABS (Rasm / Video) =====
let activeCompressTab = 'image';

function switchCompressTab(tab) {
    activeCompressTab = tab;

    document.getElementById('tabImageBtn').classList.toggle('active', tab === 'image');
    document.getElementById('tabVideoBtn').classList.toggle('active', tab === 'video');
    document.getElementById('compressImageTab').classList.toggle('active', tab === 'image');
    document.getElementById('compressVideoTab').classList.toggle('active', tab === 'video');
    document.getElementById('compressTagline').textContent = tab === 'image'
        ? "Rasmni sifatini saqlagan holda siqing"
        : "Videoni sifatini saqlagan holda siqing";

    if (tab === 'image') {
        document.getElementById('videoActionButtons').classList.add('hidden');
        document.getElementById('videoDoneButtons').classList.add('hidden');
        if (compressedBlob !== null) updateCompressUI('done');
        else if (compressFile !== null) updateCompressUI('settings');
        else updateCompressUI('upload');
    } else {
        cel.actionButtons.classList.add('hidden');
        cel.doneButtons.classList.add('hidden');
        if (typeof syncVideoCompressUI === 'function') syncVideoCompressUI();
    }
}

function downloadCompressed() {
    if (!compressedBlob) return;
    const ext = compressFile.type === 'image/png' ? 'jpg' : (compressFile.name.split('.').pop() || 'jpg');
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Rasm yuklab olindi', 'success');
}

async function shareCompressed() {
    if (!compressedBlob) return;
    const ext = compressFile.type === 'image/png' ? 'jpg' : (compressFile.name.split('.').pop() || 'jpg');
    const file = new File([compressedBlob], `compressed-${Date.now()}.${ext}`, { type: compressedBlob.type });
    if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({ files: [file], title: 'Siqilgan rasm' });
            showToast('Rasm ulashildi', 'success');
        } catch (err) {
            if (err.name !== 'AbortError') showToast('Ulashishda xatolik', 'error');
        }
    } else {
        showToast('Brauzeringiz ulashishni qo\'llab-quvvatlamaydi', 'error');
    }
}

onQualityChange(75);

// ===================================================
// ===== MERGE =====
// ===================================================
let mergeFiles = [];
let mergedBlob = null;
const MAX_PDF_FILES = 15;

const mel = {
    uploadArea: document.getElementById('mergeUploadArea'),
    fileInput: document.getElementById('mergeFileInput'),
    uploadSection: document.getElementById('mergeUploadSection'),
    previewSection: document.getElementById('mergePreviewSection'),
    doneSection: document.getElementById('mergeDoneSection'),
    mergeList: document.getElementById('mergeList'),
    fileCount: document.getElementById('pdfFileCount'),
    actionButtons: document.getElementById('mergeActionButtons'),
    doneButtons: document.getElementById('mergeDoneButtons'),
    backButton: document.getElementById('mergeBackButton'),
    mergeBtn: document.getElementById('mergeBtn'),
    mergeBtnText: document.getElementById('mergeBtnText'),
    mergedPageCount: document.getElementById('mergedPageCount'),
    mergedFileCount: document.getElementById('mergedFileCount'),
    mergedSize: document.getElementById('mergedSize')
};

mel.fileInput.addEventListener('change', handleMergeFiles);

mel.uploadArea.addEventListener('click', (e) => {
    if (e.target === mel.uploadArea || e.target.closest('.upload-icon-wrapper') || e.target.closest('.upload-title') || e.target.closest('.upload-subtitle')) {
        mel.fileInput.click();
    }
});

mel.uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mel.uploadArea.classList.add('dragover');
});

mel.uploadArea.addEventListener('dragleave', () => mel.uploadArea.classList.remove('dragover'));

mel.uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mel.uploadArea.classList.remove('dragover');
    mel.fileInput.files = e.dataTransfer.files;
    handleMergeFiles();
});

function handleMergeFiles() {
    const files = Array.from(mel.fileInput.files);
    const validPDFs = files.filter(f => f.type === 'application/pdf');

    if (validPDFs.length !== files.length) {
        showToast('Faqat PDF fayllari qo\'llab-quvvatlanadi', 'error');
    }

    if (validPDFs.length === 0) return;

    // Max 15 ta faylni qabul qil
    const toAdd = validPDFs.slice(0, MAX_PDF_FILES - mergeFiles.length);
    if (toAdd.length < validPDFs.length) {
        showToast(`Faqat ${MAX_PDF_FILES} ta fayl qabul qilinadi`, 'warning');
    }

    toAdd.forEach(file => {
        const pdfData = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            name: file.name
        };
        mergeFiles.push(pdfData);
        addMergePreview(pdfData);
    });

    updateMergeUI();
    showToast(`${toAdd.length} ta PDF yuklandi`, 'success');
}

function addMergePreview(pdfData) {
    const item = document.createElement('div');
    item.className = 'merge-item';
    item.id = 'merge-' + pdfData.id;
    item.innerHTML = `
        <div class="merge-item-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
        </div>
        <div class="merge-item-info">
            <div class="merge-item-name">${pdfData.name}</div>
            <div class="merge-item-size">${formatSize(pdfData.file.size)}</div>
        </div>
        <button class="merge-remove-btn" onclick="removeMergePDF('${pdfData.id}')">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    mel.mergeList.appendChild(item);
}

function removeMergePDF(id) {
    mergeFiles = mergeFiles.filter(f => f.id !== id);
    document.getElementById('merge-' + id).remove();
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

async function doMerge() {
    if (mergeFiles.length === 0) return;

    mel.mergeBtn.disabled = true;
    mel.mergeBtnText.textContent = 'Birlantirilmoqda...';
    showToast('PDFlar birlantirilmoqda...', 'info');

    try {
        const pdf = new jsPDF();
        let totalPages = 0;

        for (let i = 0; i < mergeFiles.length; i++) {
            const pdfFile = mergeFiles[i];
            const arrayBuffer = await pdfFile.file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;

            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                if (totalPages > 0) pdf.addPage();
                totalPages++;

                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport }).promise;

                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pw = pdf.internal.pageSize.getWidth();
                const ph = pdf.internal.pageSize.getHeight();
                
                pdf.addImage(imgData, 'JPEG', 0, 0, pw, ph);
            }
        }

        mergedBlob = pdf.output('blob');
        mel.mergedPageCount.textContent = totalPages;
        mel.mergedFileCount.textContent = mergeFiles.length;
        mel.mergedSize.textContent = (mergedBlob.size / 1024).toFixed(1) + ' KB';

        showToast('PDF tayyor!', 'success');
        updateMergeUI();
    } catch (err) {
        showToast('Xatolik yuz berdi', 'error');
        console.error(err);
    } finally {
        mel.mergeBtn.disabled = false;
        mel.mergeBtnText.textContent = 'Birlashtirish';
    }
}

function downloadMerged() {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `merged-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
