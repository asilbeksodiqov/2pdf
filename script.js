// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8561049037:AAEbMoh0BTPRx5mUR99ui-uyg764vGO8spY';
const TELEGRAM_CHAT_ID = '7123672881';

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
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Check if app is already installed
        window.addEventListener('appinstalled', (e) => {
            console.log('PWA installed');
            this.hideInstallButton();
            toast.show('Muvaffaqiyatli', 'IMG2PDF ilovasi o\'rnatildi', 'success');
        });

        // Detect if running as PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            document.body.classList.add('pwa-mode');
        }

        // iOS detection
        window.addEventListener('load', () => {
            if (navigator.standalone) {
                document.body.classList.add('pwa-mode');
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

// Initialize
const toast = new Toast();
let pwaInstaller;
let offlineManager;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadArea = document.getElementById('uploadArea');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const convertBtn = document.getElementById('convertBtn');
const downloadLink = document.getElementById('downloadLink');
const removeImageBtn = document.getElementById('removeImageBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const feedbackForm = document.getElementById('feedbackForm');
const ratingStars = document.querySelectorAll('.star');

// Variables
let selectedFile = null;
let currentRating = 0;
let isConverting = false;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('Service Worker registered:', registration.scope);
            
            // Initialize PWA
            pwaInstaller = new PWAInstaller();
            
            // Initialize offline manager
            offlineManager = new OfflineManager();
            
            // Check for updates
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
                this.saveLastTab(item.getAttribute('href'));
            }
        });
    });

    // Restore last tab
    this.restoreLastTab();

    // File selection
    selectFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    setupDragAndDrop();

    // Rating stars
    ratingStars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.getAttribute('data-value'));
            currentRating = value;
            
            ratingStars.forEach((s, index) => {
                if (index < value) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            document.getElementById('ratingValue').value = value;
        });
    });

    // Feedback form
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    // Remove image
    removeImageBtn.addEventListener('click', removeImage);

    // Convert to PDF
    convertBtn.addEventListener('click', convertToPDF);

    // Add beforeunload event for PWA
    window.addEventListener('beforeunload', () => {
        this.saveAppState();
    });

    // Restore app state
    this.restoreAppState();
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
        selectedFileName: selectedFile ? selectedFile.name : null,
        lastUploadTime: selectedFile ? new Date().toISOString() : null,
        rating: currentRating
    };
    localStorage.setItem('appState', JSON.stringify(state));
}

function restoreAppState() {
    const state = JSON.parse(localStorage.getItem('appState') || '{}');
    if (state.selectedFileName) {
        // Could implement auto-restore of last file if needed
    }
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
        const file = dt.files[0];
        if (file) {
            handleFile(file);
        }
    }
}

// File handling
function handleFileSelect(e) {
    if (e.target.files.length) {
        handleFile(e.target.files[0]);
    }
}

function handleFile(file) {
    if (!file.type.match('image.*')) {
        toast.show('Xatolik', 'Faqat rasm fayllari qabul qilinadi', 'error');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        toast.show('Xatolik', 'Fayl hajmi 10MB dan oshmasligi kerak', 'error');
        return;
    }

    selectedFile = file;

    fileName.textContent = truncateFileName(file.name);
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type.split('/')[1].toUpperCase();

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        previewSection.style.display = 'block';
        convertBtn.disabled = false;
        
        // Save file reference for PWA
        saveFileReference(file);
        
        toast.show('Muvaffaqiyatli', 'Rasm yuklandi', 'success');
    };
    reader.readAsDataURL(file);
}

function saveFileReference(file) {
    // For PWA: Save file info for offline access
    const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    };
    localStorage.setItem('lastFileInfo', JSON.stringify(fileInfo));
}

function truncateFileName(name) {
    if (name.length > 20) {
        return name.substring(0, 15) + '...' + name.split('.').pop();
    }
    return name;
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

function removeImage() {
    selectedFile = null;
    fileInput.value = '';
    previewSection.style.display = 'none';
    convertBtn.disabled = true;
    downloadLink.style.display = 'none';
    progressContainer.style.display = 'none';
    
    // Clear saved file reference
    localStorage.removeItem('lastFileInfo');
    
    toast.show('Bildirishnoma', 'Rasm olib tashlandi', 'info');
}

// PDF Conversion
async function convertToPDF() {
    if (!selectedFile || isConverting) return;
    
    isConverting = true;
    convertBtn.disabled = true;
    progressContainer.style.display = 'block';
    progressFill.style.width = '30%';
    progressText.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rasm qayta ishlanmoqda...';

    try {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('PDF kutubxonasi yuklanmagan');
        }

        await simulateProgress();

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const img = new Image();

        img.src = imagePreview.src;

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

        // Add PWA info to PDF if running as PWA
        if (pwaInstaller && pwaInstaller.isRunningAsPWA()) {
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text('IMG2PDF PWA ilovasi orqali yaratildi', 20, pdfHeight - 5);
        }

        const timestamp = new Date().getTime();
        const pdfFileName = `img2pdf_${timestamp}.pdf`;

        // Auto download
        pdf.save(pdfFileName);

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        downloadLink.href = pdfUrl;
        downloadLink.download = pdfFileName;
        downloadLink.style.display = 'flex';

        progressFill.style.width = '100%';
        progressText.innerHTML = '<i class="fas fa-check"></i> Tayyor! PDF yuklandi';

        toast.show('Muvaffaqiyatli', 'PDF yaratildi va yuklandi', 'success');

        // Save conversion history for PWA
        saveConversionHistory(pdfFileName, selectedFile.name);

        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressFill.style.width = '0%';
            convertBtn.disabled = false;
            isConverting = false;
            
            setTimeout(() => {
                URL.revokeObjectURL(pdfUrl);
            }, 1000);
        }, 3000);

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

function saveConversionHistory(pdfName, imageName) {
    const history = JSON.parse(localStorage.getItem('conversionHistory') || '[]');
    history.unshift({
        pdfName,
        imageName,
        timestamp: new Date().toISOString(),
        size: selectedFile ? selectedFile.size : 0
    });
    
    // Keep only last 10 conversions
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('conversionHistory', JSON.stringify(history));
}

async function simulateProgress() {
    return new Promise(resolve => {
        let progress = 30;
        const interval = setInterval(() => {
            progress += 20;
            progressFill.style.width = progress + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
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
    const rating = document.getElementById('ratingValue').value;
    
    if (!message) {
        toast.show('Xatolik', 'Iltimos, xabar matnini kiriting', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('.btn-submit');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;
    
    try {
        const telegramMessage = `
<b>IMG2PDF Feedback</b>
<b>Reyting:</b> ${rating}/5
<b>Xabar:</b>
${message}
<b>Vaqt:</b> ${new Date().toLocaleString()}
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
            
            toast.show('Offlayn', 'Xabar saqlandi. Onlayn bo\'lganda yuboriladi', 'info');
            
            feedbackForm.reset();
            ratingStars.forEach(star => star.classList.remove('active'));
            document.getElementById('ratingValue').value = '0';
            currentRating = 0;
        } else {
            // Send immediately
            const sent = await sendToTelegram(telegramMessage);
            
            if (sent) {
                toast.show('Rahmat!', 'Fikringiz uchun tashakkur', 'success');
                
                feedbackForm.reset();
                ratingStars.forEach(star => star.classList.remove('active'));
                document.getElementById('ratingValue').value = '0';
                currentRating = 0;
            } else {
                toast.show('Xatolik', 'Xabar yuborishda xatolik', 'error');
            }
        }
        
    } catch (error) {
        console.error('Feedback xatosi:', error);
        toast.show('Xatolik', 'Xabar yuborishda xatolik', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// PWA Share API integration
if (navigator.share) {
    // Add share button functionality
    function setupSharing() {
        const shareBtn = document.createElement('button');
        shareBtn.className = 'share-btn';
        shareBtn.innerHTML = '<i class="fas fa-share-alt"></i>';
        shareBtn.addEventListener('click', shareApp);
        
        if (pwaInstaller && pwaInstaller.isRunningAsPWA()) {
            document.querySelector('.header-content').appendChild(shareBtn);
        }
    }
    
    async function shareApp() {
        try {
            await navigator.share({
                title: 'IMG2PDF',
                text: 'Rasmlarni PDFga aylantirish ilovasi',
                url: window.location.href
            });
        } catch (error) {
            console.log('Sharing cancelled:', error);
        }
    }
    
    // Initialize sharing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSharing);
    } else {
        setupSharing();
    }
}

// PWA Background Sync (if supported)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
    async function registerBackgroundSync() {
        const registration = await navigator.serviceWorker.ready;
        registration.sync.register('send-feedback');
    }
    
    // Register sync when feedback is saved offline
    window.addEventListener('offlineFeedbackSaved', registerBackgroundSync);
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