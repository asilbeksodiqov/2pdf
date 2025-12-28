// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8561049037:AAEbMoh0BTPRx5mUR99ui-uyg764vGO8spY';
const TELEGRAM_CHAT_ID = '7123672881';

// App Configuration
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const FEEDBACK_COOLDOWN = 60 * 60 * 1000; // 1 hour

// Toast Notification System
class Toast {
    constructor() {
        this.container = document.getElementById('toastContainer') || this.createToastContainer();
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    show(title, message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode === this.container) {
                    this.container.removeChild(toast);
                }
            }, 300);
        }, duration);

        return toast;
    }

    getIcon(type) {
        switch(type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }
}

// PWA Installation Manager
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.init();
    }

    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('PWA installed');
            this.hideInstallButton();
            toast.show('Muvaffaqiyatli', 'IMG2PDF ilovasi o\'rnatildi', 'success');
        });

        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('pwa-mode');
            this.showShareButton();
        }

        window.addEventListener('load', () => {
            if (navigator.standalone) {
                document.body.classList.add('pwa-mode');
                this.showShareButton();
            }
        });
    }

    showInstallButton() {
        if (window.matchMedia('(display-mode: standalone)').matches || 
            navigator.standalone) {
            return;
        }

        if (!this.installButton) {
            this.installButton = document.createElement('button');
            this.installButton.className = 'pwa-install-btn';
            this.installButton.innerHTML = '<i class="fas fa-download"></i> Ilovani o\'rnatish';
            this.installButton.addEventListener('click', () => this.installApp());
            
            document.body.appendChild(this.installButton);
            
            setTimeout(() => {
                this.installButton.classList.add('show');
            }, 1000);
        }
    }

    hideInstallButton() {
        if (this.installButton) {
            this.installButton.classList.remove('show');
            setTimeout(() => {
                if (this.installButton.parentNode) {
                    this.installButton.parentNode.removeChild(this.installButton);
                    this.installButton = null;
                }
            }, 300);
        }
    }

    async installApp() {
        if (!this.deferredPrompt) {
            toast.show('Xatolik', 'Ilovani o\'rnatish imkoni mavjud emas', 'error');
            return;
        }

        this.deferredPrompt.prompt();
        const choiceResult = await this.deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
            toast.show('Muvaffaqiyatli', 'Ilova o\'rnatilmoqda...', 'success');
        } else {
            toast.show('Bildirishnoma', 'Ilova o\'rnatilmadi', 'info');
        }
        
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    isRunningAsPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               navigator.standalone ||
               document.referrer.includes('android-app://');
    }

    showShareButton() {
        const shareBtn = document.getElementById('shareAppBtn');
        if (shareBtn) {
            shareBtn.style.display = 'block';
            shareBtn.addEventListener('click', this.shareApp);
        }
    }

    async shareApp() {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'IMG2PDF',
                    text: 'Rasmlarni PDFga aylantirish ilovasi',
                    url: window.location.href
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.log('Sharing cancelled:', error);
                }
            }
        } else {
            toast.show('Xatolik', 'Ulashish imkoni mavjud emas', 'error');
        }
    }
}

// Offline Manager
class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineIndicator = null;
        this.init();
    }

    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateIndicator();
            toast.show('Onlayn', 'Internetga ulandi', 'success');
            this.sendPendingFeedback();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateIndicator();
            toast.show('Offlayn', 'Internet aloqasi uzildi', 'warning');
        });

        this.createIndicator();
        this.updateIndicator();
    }

    createIndicator() {
        this.offlineIndicator = document.createElement('div');
        this.offlineIndicator.className = 'offline-indicator';
        this.offlineIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Offlayn';
        document.body.appendChild(this.offlineIndicator);
    }

    updateIndicator() {
        if (this.isOnline) {
            document.body.classList.remove('offline');
            document.body.classList.add('online');
            this.offlineIndicator.style.display = 'none';
        } else {
            document.body.classList.remove('online');
            document.body.classList.add('offline');
            this.offlineIndicator.style.display = 'block';
        }
    }

    checkConnection() {
        return this.isOnline;
    }

    async sendPendingFeedback() {
        const pending = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
        if (pending.length === 0) return;

        for (const feedback of pending) {
            await this.sendSingleFeedback(feedback);
        }
        
        localStorage.removeItem('pendingFeedback');
        if (pending.length > 0) {
            toast.show('Muvaffaqiyatli', `${pending.length} ta saqlangan xabar yuborildi`, 'success');
        }
    }

    async sendSingleFeedback(feedback) {
        const telegramMessage = `
<b>📩 IMG2PDF Feedback (Offline)</b>
<b>Reyting:</b> ${feedback.rating}/5
<b>Xabar:</b>
${feedback.message}
<b>Vaqt:</b> ${new Date(feedback.timestamp).toLocaleString()}
        `.trim();

        return await sendToTelegram(telegramMessage);
    }
}

// Image Manager
class ImageManager {
    constructor() {
        this.images = [];
        this.currentPDFBlob = null;
    }

    addImage(file) {
        if (this.images.length >= MAX_IMAGES) {
            toast.show('Xatolik', `Maksimum ${MAX_IMAGES} ta rasm yuklash mumkin`, 'error');
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast.show('Xatolik', 'Fayl hajmi 10MB dan oshmasligi kerak', 'error');
            return false;
        }

        if (!file.type.match('image.*')) {
            toast.show('Xatolik', 'Faqat rasm fayllari qabul qilinadi', 'error');
            return false;
        }

        this.images.push(file);
        return true;
    }

    removeImage(index) {
        this.images.splice(index, 1);
    }

    clearAll() {
        this.images = [];
        this.currentPDFBlob = null;
    }

    getImages() {
        return this.images;
    }

    getCount() {
        return this.images.length;
    }

    getTotalSize() {
        return this.images.reduce((total, file) => total + file.size, 0);
    }

    setPDFBlob(blob) {
        this.currentPDFBlob = blob;
    }

    getPDFBlob() {
        return this.currentPDFBlob;
    }
}

// Feedback Manager
class FeedbackManager {
    constructor() {
        this.lastFeedbackTime = this.getLastFeedbackTime();
        this.init();
    }

    init() {
        this.updateFeedbackTimer();
        setInterval(() => this.updateFeedbackTimer(), 60000); // Update every minute
    }

    getLastFeedbackTime() {
        return parseInt(localStorage.getItem('lastFeedbackTime') || '0');
    }

    setLastFeedbackTime() {
        const time = Date.now();
        localStorage.setItem('lastFeedbackTime', time.toString());
        this.lastFeedbackTime = time;
    }

    canSendFeedback() {
        const now = Date.now();
        const timePassed = now - this.lastFeedbackTime;
        return timePassed >= FEEDBACK_COOLDOWN;
    }

    getRemainingTime() {
        const now = Date.now();
        const timePassed = now - this.lastFeedbackTime;
        const remaining = FEEDBACK_COOLDOWN - timePassed;
        
        if (remaining <= 0) return 0;
        
        const minutes = Math.ceil(remaining / 60000);
        return minutes;
    }

    updateFeedbackTimer() {
        const feedbackTimer = document.getElementById('feedbackTimer');
        const warningElement = document.querySelector('.feedback-warning');
        const submitBtn = document.getElementById('feedbackSubmitBtn');
        
        if (!this.canSendFeedback()) {
            const minutes = this.getRemainingTime();
            
            if (feedbackTimer) {
                feedbackTimer.textContent = `${minutes} min`;
                feedbackTimer.style.display = 'block';
            }
            
            if (warningElement) {
                const nextTime = new Date(this.lastFeedbackTime + FEEDBACK_COOLDOWN);
                warningElement.querySelector('#nextFeedbackTime').textContent = 
                    nextTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
                warningElement.style.display = 'block';
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fas fa-clock"></i> ${minutes} daqiqadan keyin`;
            }
        } else {
            if (feedbackTimer) feedbackTimer.style.display = 'none';
            if (warningElement) warningElement.style.display = 'none';
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Xabarni Yuborish';
            }
        }
    }

    validateFeedback(message, rating) {
        if (!message.trim()) {
            toast.show('Xatolik', 'Iltimos, xabar matnini kiriting', 'error');
            return false;
        }

        if (rating < 1) {
            const errorElement = document.querySelector('.rating-error');
            if (errorElement) {
                errorElement.style.display = 'block';
            }
            toast.show('Xatolik', 'Iltimos, baholashni tanlang', 'error');
            return false;
        }

        return true;
    }
}

// Initialize
const toast = new Toast();
let pwaInstaller;
let offlineManager;
let imageManager;
let feedbackManager;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const imagesGrid = document.getElementById('imagesGrid');
const imagesCount = document.getElementById('imagesCount');
const totalSize = document.getElementById('totalSize');
const convertBtn = document.getElementById('convertBtn');
const sharePdfBtn = document.getElementById('sharePdfBtn');
const downloadLink = document.getElementById('downloadLink');
const addMoreBtn = document.getElementById('addMoreBtn');
const removeAllBtn = document.getElementById('removeAllBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const feedbackForm = document.getElementById('feedbackForm');
const ratingStars = document.querySelectorAll('.star');
const feedbackSubmitBtn = document.getElementById('feedbackSubmitBtn');

// Variables
let isConverting = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize managers
    imageManager = new ImageManager();
    feedbackManager = new FeedbackManager();

    // Initialize Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration.scope);
            
            pwaInstaller = new PWAInstaller();
            offlineManager = new OfflineManager();
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        toast.show('Yangilanish', 'Yangi versiya mavjud. Yangilash uchun sahifani yangilang.', 'info');
                    }
                });
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    // Bottom Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            item.classList.add('active');
            const targetTab = document.querySelector(item.getAttribute('href'));
            if (targetTab) {
                targetTab.classList.add('active');
                saveLastTab(item.getAttribute('href'));
                
                // Update feedback timer when feedback tab is opened
                if (item.getAttribute('href') === '#feedback-tab') {
                    feedbackManager.updateFeedbackTimer();
                }
            }
        });
    });

    // Add more images
    addMoreBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // Remove all images
    removeAllBtn.addEventListener('click', removeAllImages);

    // Drag and drop
    setupDragAndDrop();

    // Rating stars
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            
            ratingStars.forEach((s, index) => {
                if (index < value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            document.getElementById('ratingValue').value = value;
            
            // Hide error message if rating is selected
            const errorElement = document.querySelector('.rating-error');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });

    // Feedback form
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // Convert to PDF
    convertBtn.addEventListener('click', convertToPDF);

    // Share PDF
    sharePdfBtn.addEventListener('click', sharePDF);

    // Initialize PWA sharing
    if (navigator.share && pwaInstaller && pwaInstaller.isRunningAsPWA()) {
        const shareAppBtn = document.getElementById('shareAppBtn');
        if (shareAppBtn) {
            shareAppBtn.addEventListener('click', () => pwaInstaller.shareApp());
        }
    }

    // Add beforeunload event for PWA
    window.addEventListener('beforeunload', () => {
        saveAppState();
    });

    // Restore app state
    restoreAppState();
});

// Tab management
function saveLastTab(tabId) {
    localStorage.setItem('lastTab', tabId);
}

function restoreLastTab() {
    const lastTab = localStorage.getItem('lastTab') || '#home-tab';
    const tabElement = document.querySelector(`[href="${lastTab}"]`);
    if (tabElement) {
        tabElement.click();
    }
}

// App state management
function saveAppState() {
    const state = {
        lastUploadTime: new Date().toISOString(),
        imagesCount: imageManager.getCount()
    };
    localStorage.setItem('appState', JSON.stringify(state));
}

function restoreAppState() {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    // Could implement auto-restore if needed
}

// Drag and drop setup
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(Array.from(files));
        }
    }
}

// File handling
function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFiles(Array.from(e.target.files));
    }
}

function handleFiles(files) {
    let addedCount = 0;
    
    for (const file of files) {
        if (imageManager.addImage(file)) {
            addedCount++;
        }
        
        if (imageManager.getCount() >= MAX_IMAGES) {
            break;
        }
    }
    
    if (addedCount > 0) {
        updatePreview();
        toast.show('Muvaffaqiyatli', `${addedCount} ta rasm yuklandi`, 'success');
    }
}

function updatePreview() {
    const images = imageManager.getImages();
    
    if (images.length === 0) {
        // No images - show upload area
        uploadArea.classList.remove('hidden');
        previewSection.style.display = 'none';
        convertBtn.style.display = 'none';
        sharePdfBtn.style.display = 'none';
        downloadLink.style.display = 'none';
        return;
    }
    
    // Hide upload area
    uploadArea.classList.add('hidden');
    previewSection.style.display = 'block';
    
    // Update images grid
    imagesGrid.innerHTML = '';
    
    images.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="Rasm ${index + 1}">
                <button class="remove-image-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            imagesGrid.appendChild(imageItem);
            
            // Add remove event listener
            const removeBtn = imageItem.querySelector('.remove-image-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeImage(index);
            });
        };
        reader.readAsDataURL(file);
    });
    
    // Update file info
    imagesCount.textContent = imageManager.getCount();
    totalSize.textContent = formatFileSize(imageManager.getTotalSize());
    
    // Show convert button
    convertBtn.style.display = 'flex';
    sharePdfBtn.style.display = 'none';
    downloadLink.style.display = 'none';
}

function removeImage(index) {
    imageManager.removeImage(index);
    updatePreview();
    
    if (imageManager.getCount() === 0) {
        toast.show('Bildirishnoma', 'Rasm olib tashlandi', 'info');
    } else {
        toast.show('Bildirishnoma', 'Rasm olib tashlandi', 'info');
    }
}

function removeAllImages() {
    if (imageManager.getCount() === 0) return;
    
    imageManager.clearAll();
    updatePreview();
    toast.show('Bildirishnoma', 'Barcha rasmlar olib tashlandi', 'info');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

// PDF Conversion
async function convertToPDF() {
    if (imageManager.getCount() === 0 || isConverting) return;
    
    isConverting = true;
    convertBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressFill.style.width = '10%';
    progressText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rasmlar qayta ishlanmoqda...';

    try {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('PDF kutubxonasi yuklanmagan');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const images = imageManager.getImages();

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            
            // Update progress
            const progress = 10 + (i / images.length * 80);
            progressFill.style.width = progress + '%';
            progressText.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Rasm ${i + 1}/${images.length} qayta ishlanmoqda...`;
            
            const img = new Image();
            const imgSrc = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            
            img.src = imgSrc;
            
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            let imgWidth = pdfWidth - 40;
            let imgHeight = (img.height * imgWidth) / img.width;

            if (imgHeight > pdfHeight - 40) {
                imgHeight = pdfHeight - 40;
                imgWidth = (img.width * imgHeight) / img.height;
            }

            const x = (pdfWidth - imgWidth) / 2;
            const y = (pdfHeight - imgHeight) / 2;

            pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
            
            // Add page number
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Rasm ${i + 1}/${images.length}`, pdfWidth - 30, pdfHeight - 10);

            // Add new page if not last image
            if (i < images.length - 1) {
                pdf.addPage();
            }
        }

        // Add PWA info to PDF if running as PWA
        if (pwaInstaller && pwaInstaller.isRunningAsPWA()) {
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('IMG2PDF PWA ilovasi orqali yaratildi', 20, pdf.internal.pageSize.getHeight() - 5);
        }

        const timestamp = new Date().getTime();
        const pdfFileName = `img2pdf_${timestamp}.pdf`;

        // Generate blob
        const pdfBlob = pdf.output('blob');
        imageManager.setPDFBlob(pdfBlob);
        
        const pdfUrl = URL.createObjectURL(pdfBlob);
        downloadLink.href = pdfUrl;
        downloadLink.download = pdfFileName;

        progressFill.style.width = '100%';
        progressText.innerHTML = '<i class="fas fa-check"></i> Tayyor!';

        // Hide convert button, show share and download buttons
        convertBtn.style.display = 'none';
        sharePdfBtn.style.display = 'flex';
        downloadLink.style.display = 'flex';

        toast.show('Muvaffaqiyatli', `${images.length} ta rasm PDFga aylantirildi`, 'success');

        // Save conversion history for PWA
        saveConversionHistory(pdfFileName, images.length);

        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
            convertBtn.disabled = false;
            isConverting = false;
        }, 2000);

    } catch (error) {
        console.error('Xatolik:', error);
        
        progressText.innerHTML = '<i class="fas fa-times"></i> Xatolik yuz berdi';
        progressFill.style.background = 'var(--error)';
        
        toast.show('Xatolik', 'PDF yaratishda muammo', 'error');
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
            progressFill.style.background = '';
            convertBtn.disabled = false;
            isConverting = false;
        }, 3000);
    }
}

// Share PDF
async function sharePDF() {
    const pdfBlob = imageManager.getPDFBlob();
    
    if (!pdfBlob) {
        toast.show('Xatolik', 'Avval PDF yaratishingiz kerak', 'error');
        return;
    }
    
    if (!navigator.share) {
        // Fallback to download
        downloadLink.click();
        return;
    }
    
    try {
        const timestamp = new Date().getTime();
        const pdfFileName = `img2pdf_${timestamp}.pdf`;
        const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });
        
        await navigator.share({
            files: [pdfFile],
            title: 'IMG2PDF - Rasmlardan yaratilgan PDF',
            text: `${imageManager.getCount()} ta rasm PDFga aylantirildi`
        });
        
        toast.show('Muvaffaqiyatli', 'PDF muvaffaqiyatli ulashildi', 'success');
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Sharing error:', error);
            toast.show('Xatolik', 'Ulashishda muammo', 'error');
            
            // Fallback to download
            setTimeout(() => {
                downloadLink.click();
            }, 500);
        }
    }
}

function saveConversionHistory(pdfName, imagesCount) {
    const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
    history.unshift({
        pdfName,
        imagesCount,
        timestamp: new Date().toISOString(),
        totalSize: imageManager.getTotalSize()
    });
    
    // Keep only last 10 conversions
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('conversionHistory', JSON.stringify(history));
}

// Send message to Telegram
async function sendToTelegram(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Telegram xatosi:', error);
        return false;
    }
}

// Feedback form
async function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    const message = document.getElementById('feedbackMessage').value.trim();
    const rating = parseInt(document.getElementById('ratingValue').value);
    
    // Validate
    if (!feedbackManager.validateFeedback(message, rating)) {
        return;
    }
    
    // Check cooldown
    if (!feedbackManager.canSendFeedback()) {
        const minutes = feedbackManager.getRemainingTime();
        toast.show('Kutish', `${minutes} daqiqadan keyin xabar yuborishingiz mumkin`, 'warning');
        return;
    }
    
    // Disable form
    const submitBtn = feedbackSubmitBtn;
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;
    
    try {
        const telegramMessage = `
<b>IMG2PDF Feedback</b>
<b>Reyting:</b> ${rating}/5
<b>Xabar:</b>
${message}
        `.trim();

        // Check if online
        if (offlineManager && !offlineManager.checkConnection()) {
            // Save for later
            const pending = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
            pending.push({
                message,
                rating,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('pendingFeedback', JSON.stringify(pending));
            
            // Still update cooldown
            feedbackManager.setLastFeedbackTime();
            
            toast.show('Offlayn', 'Xabar saqlandi. Onlayn bo\'lganda yuboriladi', 'info');
            
            feedbackForm.reset();
            ratingStars.forEach(star => star.classList.remove('active'));
            document.getElementById('ratingValue').value = '0';
        } else {
            // Send immediately
            const sent = await sendToTelegram(telegramMessage);
            
            if (sent) {
                // Update last feedback time
                feedbackManager.setLastFeedbackTime();
                
                toast.show('Rahmat!', 'Fikringiz uchun tashakkur', 'success');
                
                feedbackForm.reset();
                ratingStars.forEach(star => star.classList.remove('active'));
                document.getElementById('ratingValue').value = '0';
            } else {
                toast.show('Xatolik', 'Xabar yuborishda xatolik', 'error');
            }
        }
        
    } catch (error) {
        console.error('Feedback xatosi:', error);
        toast.show('Xatolik', 'Xabar yuborishda xatolik', 'error');
    } finally {
        feedbackManager.updateFeedbackTimer();
    }
}

// PWA Badging API (if supported)
if ('setAppBadge' in navigator) {
    function updateBadge() {
        const pending = JSON.parse(localStorage.getItem('pendingFeedback') || '[]');
        if (pending.length > 0) {
            navigator.setAppBadge(pending.length);
        } else {
            navigator.clearAppBadge();
        }
    }
    
    // Update badge when feedback changes
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        if (key === 'pendingFeedback') {
            updateBadge();
        }
    };
    
    // Initial badge update
    updateBadge();
}


