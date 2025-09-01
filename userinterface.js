const CLIENT_ID = '6829064744000489573';
const REDIRECT_URI = 'http://localhost:3000/auth/callback';
const ROBLOX_AUTH_URL = `http://localhost:3000/api/auth`;
let currentUser = null;
let tickerInterval;
const recentWins = [];
let paymentCheckInterval = null;

function showNotification(type, message, duration = 3000) {
    const container = document.getElementById('notification-container');
    if (!container) return;  
    
    const notification = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="notification-icon fas ${icons[type]}"></i>
        <div class="notification-content">${message}</div>
        <div class="close-notification">&times;</div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    const closeBtn = notification.querySelector('.close-notification');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }
}

async function showRobuxPaymentModal() {
    if (!currentUser) {
        showNotification('warning', 'Please login first');
        return;
    }

    try {
        const response = await fetch('/api/token-packages');
        if (!response.ok) throw new Error('Failed to get packages');
        
        const packages = await response.json();
        
        const modalHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div class="glass-effect rounded-2xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg md:text-xl font-bold">Purchase Tokens with Robux</h3>
                        <button class="close-modal text-2xl">&times;</button>
                    </div>
                    <div class="mb-4 md:mb-6">
                        <p class="text-white/80 mb-3 md:mb-4">Select a token package:</p>
                        <div class="grid grid-cols-1 gap-2 md:gap-3">
                            ${packages.map(pkg => `
                                <button class="robux-package-btn glass-effect p-3 md:p-4 rounded-lg hover:bg-purple-500/20 transition-all ${pkg.popular ? 'border-2 border-yellow-500' : ''}" 
                                        data-tokens="${pkg.tokens}" data-robux="${pkg.robux}">
                                    <div class="flex justify-between items-center">
                                        <div class="text-left">
                                            <div class="font-bold text-base md:text-lg">${pkg.tokens} Tokens</div>
                                            <div class="text-white/70 text-sm md:text-base">${pkg.robux} Robux</div>
                                        </div>
                                        ${pkg.popular ? '<span class="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">POPULAR</span>' : ''}
                                    </div>
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    <div class="text-center text-xs md:text-sm text-white/60">
                        <p class="mb-1">⚡ After purchasing the gamepass, your tokens will be added automatically</p>
                        <p>⏰ Payment link expires in 15 minutes</p>
                    </div>
                </div>
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelectorAll('.robux-package-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const tokens = parseInt(btn.dataset.tokens);
                const robux = parseInt(btn.dataset.robux);
                modal.remove();
                await createRobuxPayment(tokens, robux);
            });
        });
        
        // Предотвращение скролла страницы под модальным окном на мобильных устройствах
        document.body.style.overflow = 'hidden';
        modal.addEventListener('remove', () => {
            document.body.style.overflow = '';
        });
        
    } catch (error) {
        showNotification('error', 'Failed to load token packages');
        console.error('Payment modal error:', error);
    }
}
const translations = {
    en: {
        siteName: "Case With Robux",
        settings: "Settings",
        theme: "Theme",
        themeCosmos: "Cosmos",
        themeDark: "Dark",
        themeLight: "Light",
        language: "Language",
        cases: "Cases",
        inventory: "Inventory",
        battle: "Battle",
        topUp: "Top Up",
        open: "Open",
        logout: "Logout",
        login: "Login with Roblox",
        copyright: "© 2025 Quasar LLC. POWERED BY NOBLOX",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        support: "Support",
        withdrawButton: "PayOut",
        processing: "Processing...",
        successWithdraw: "Robux sent!",
        errorWithdraw: "Withdrawal failed",
        inventoryTitle: "Your Inventory",
        refresh: "Refresh",
        noItems: "No items found",
        congratulations: "Congratulations! You won!",
        betterLuck: "Better luck next time!"
    },
    ru: {
        siteName: "Кейсы с Робуксами",
        settings: "Настройки",
        theme: "Тема",
        themeCosmos: "Космос",
        themeDark: "Тёмная",
        themeLight: "Светлая",
        language: "Язык",
        cases: "Кейсы",
        inventory: "Инвентарь",
        battle: "Битва",
        topUp: "Пополнить",
        open: "Открыть",
        logout: "Выйти",
        login: "Войти через Roblox",
        copyright: "© 2025 Quasar LLC. Работает на NOBLOX",
        terms: "Условия использования",
        privacy: "Политика конфиденциальности",
        support: "Поддержка",
        withdrawButton: "Вывести",
        processing: "Обработка...",
        successWithdraw: "Робуксы отправлены!",
        errorWithdraw: "Ошибка вывода",
        inventoryTitle: "Ваш инвентарь",
        refresh: "Обновить",
        noItems: "Нет предметов",
        congratulations: "Поздравляем! Вы выиграли!",
        betterLuck: "Повезёт в следующий раз!"
    }
};
async function createRobuxPayment(tokens, robuxCost) {
    try {
        showNotification('info', 'Creating unique gamepass...', 0);
        
        const response = await fetch('/api/create-robux-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ tokens })
        });
        
        if (!response.ok) {
            const error = await response.json();
            showNotification('error', error.message || 'Failed to create payment');
            return;
        }
        
        const paymentData = await response.json();
        console.log('Payment created with unique identifier:', paymentData.unique_identifier);
        showPaymentModal(paymentData);
        
    } catch (error) {
        showNotification('error', 'Error creating payment');
        console.error('Payment creation error:', error);
    }
}

function showPaymentModal(paymentData) {
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" id="payment-modal">
            <div class="glass-effect rounded-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div class="text-center">
                    <div class="mb-3 md:mb-4">
                        <i class="fas fa-coins text-3xl md:text-4xl text-yellow-500 mb-1 md:mb-2"></i>
                        <h3 class="text-lg md:text-xl font-bold">Purchase ${paymentData.tokens} Tokens</h3>
                        <p class="text-white/70 text-sm md:text-base">Cost: ${paymentData.robux_price} Robux</p>
                        <p class="text-white/50 text-xs mt-1">Unique ID: ${paymentData.unique_identifier}</p>
                    </div>
                    
                    <div class="bg-cosmic-700 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
                        <p class="text-sm text-white/80 mb-2 md:mb-3">Instructions:</p>
                        <ol class="text-xs md:text-sm text-white/70 text-left space-y-1">
                            <li>1. Click "Buy Gamepass" button below</li>
                            <li>2. Purchase the gamepass on Roblox</li>
                            <li>3. Return here and wait for automatic confirmation</li>
                            <li>4. Your tokens will be added within 1-2 minutes</li>
                        </ol>
                    </div>
                    
                    <div class="mb-3 md:mb-4">
                        <div class="flex items-center justify-center space-x-2 mb-1 md:mb-2">
                            <span class="text-yellow-500">⏰</span>
                            <span class="text-xs md:text-sm">Time remaining: </span>
                            <span id="payment-timer" class="font-bold text-yellow-500 text-sm md:text-base">15:00</span>
                        </div>
                        <div class="text-xs text-white/50">Payment expires in 15 minutes</div>
                    </div>
                    
                    <div class="space-y-2 md:space-y-3">
                        <a href="${paymentData.gamepass_url}" target="_blank" 
                           class="btn-primary block w-full py-2 md:py-3 rounded-lg font-medium text-white text-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm md:text-base">
                            <i class="fab fa-roblox mr-2"></i>Buy Gamepass on Roblox
                        </a>
                        
                        <button id="verify-payment" class="btn-secondary w-full py-2 md:py-3 rounded-lg font-medium bg-cosmic-700 hover:bg-cosmic-600 text-sm md:text-base">
                            <i class="fas fa-check mr-2"></i>Manual Verify
                        </button>
                        
                        <button id="debug-check" class="btn-secondary w-full py-1 md:py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-xs md:text-sm">
                            <i class="fas fa-bug mr-2"></i>Debug Check
                        </button>
                        
                        <button id="close-payment-modal" class="btn-secondary w-full py-1 md:py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-xs md:text-sm">
                            Cancel
                        </button>
                    </div>
                    
                    <div id="payment-status" class="mt-3 md:mt-4 text-xs md:text-sm">
                        <div class="flex items-center justify-center space-x-2">
                            <div class="animate-spin">⏳</div>
                            <span>Waiting for purchase (auto-checking every 10s)...</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    // Store payment data for later use
    modal.paymentData = paymentData;
    
    // Закрытие по клику вне модального окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            stopPaymentMonitoring();
            modal.remove();
        }
    });
    
    // Start payment monitoring
    startPaymentMonitoring(paymentData.payment_id);
    
    // Start countdown timer
    startPaymentTimer(15 * 60); // 15 minutes
    
    // Event listeners
    modal.querySelector('#close-payment-modal').addEventListener('click', () => {
        stopPaymentMonitoring();
        modal.remove();
    });
    
    modal.querySelector('#verify-payment').addEventListener('click', () => {
        verifyPayment(paymentData.gamepass_id);
    });
    
    // Debug check button
    modal.querySelector('#debug-check').addEventListener('click', async () => {
        try {
            const response = await fetch('/api/debug/check-gamepass', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    uniqueIdentifier: paymentData.unique_identifier,
                    robloxUserId: currentUser.roblox_id
                })
            });
            
            const result = await response.json();
            
            const statusElement = modal.querySelector('#payment-status');
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="text-center">
                        <div class="text-xs md:text-sm ${result.purchased ? 'text-green-400' : 'text-yellow-400'}">
                            ${result.message}
                        </div>
                        <div class="text-xs text-white/50 mt-1">
                            Checking: ${result.uniqueIdentifier}
                        </div>
                    </div>
                `;
            }
            
            if (result.purchased) {
                showNotification('success', 'Purchase detected! Processing...');
                // The monitoring system should pick this up soon
            }
            
        } catch (error) {
            console.error('Debug check error:', error);
            showNotification('error', 'Debug check failed');
        }
    });
    
    // Предотвращение скролла страницы под модальным окном на мобильных устройствах
    document.body.style.overflow = 'hidden';
    modal.addEventListener('remove', () => {
        document.body.style.overflow = '';
    });
}

function startPaymentTimer(seconds) {
    const timerElement = document.getElementById('payment-timer');
    if (!timerElement) return;
    
    const timer = setInterval(() => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
            clearInterval(timer);
            timerElement.textContent = 'EXPIRED';
            showNotification('error', 'Payment expired');
            stopPaymentMonitoring();
            document.getElementById('payment-modal')?.remove();
        }
        
        seconds--;
    }, 1000);
}

function startPaymentMonitoring(paymentId) {
    console.log('Starting payment monitoring for:', paymentId);
    
    paymentCheckInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/payment-status/${paymentId}`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const status = await response.json();
                
                console.log('Payment status check:', status);
                
                if (status.status === 'completed') {
                    stopPaymentMonitoring();
                    document.getElementById('payment-modal')?.remove();
                    showNotification('success', `Payment successful! ${status.amount} tokens added to your account`);
                    await checkAuth(); // Refresh user data
                } else if (status.status === 'failed') {
                    stopPaymentMonitoring();
                    document.getElementById('payment-modal')?.remove();
                    showNotification('error', 'Payment failed or expired');
                }
            }
        } catch (error) {
            console.error('Payment monitoring error:', error);
        }
    }, 5000); // Check every 5 seconds
}

function stopPaymentMonitoring() {
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
        console.log('Stopped payment monitoring');
    }
}

async function verifyPayment(robloxGamepassId) {
    try {
        const statusElement = document.getElementById('payment-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="flex items-center justify-center space-x-2">
                    <div class="animate-spin">⏳</div>
                    <span>Manually verifying payment...</span>
                </div>
            `;
        }
        
        const response = await fetch('/api/verify-gamepass', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ gamepassId: robloxGamepassId })
        });
        
        if (response.ok) {
            const result = await response.json();
            stopPaymentMonitoring();
            document.getElementById('payment-modal')?.remove();
            showNotification('success', result.message);
            currentUser.balance = result.newBalance;
            updateBalanceDisplay();
        } else {
            const error = await response.json();
            if (statusElement) {
                statusElement.innerHTML = `
                    <div class="text-red-400 text-center">
                        ${error.message}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        const statusElement = document.getElementById('payment-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="text-red-400 text-center">
                    Verification failed. Please try again.
                </div>
            `;
        }
    }
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement && currentUser) {
        balanceElement.textContent = `${currentUser.balance} tokens`;
    }
}

function setupEventListeners() {
    const topupBtn = document.getElementById('topup-btn');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (topupBtn) {
        topupBtn.addEventListener('click', () => {
            showRobuxPaymentModal();
        });
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = ROBLOX_AUTH_URL;
        });
    }
    
    const closePrizeBtn = document.getElementById('close-prize');
    if (closePrizeBtn) {
        closePrizeBtn.addEventListener('click', () => {
            const prizeDisplay = document.getElementById('prize-display');
            prizeDisplay.classList.remove('show');
            prizeDisplay.classList.add('hidden');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/logout', {
                method: 'GET',
                credentials: 'include'
            }).then(() => {
                window.location.reload();
            }).catch(err => {
                console.error('Logout error:', err);
            });
        });
    }
    
    document.querySelectorAll('.open-case').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (!currentUser) {
                showNotification('warning', 'Please login first');
                return;
            }
            const caseCard = e.target.closest('.case-card');
            if (!caseCard) return;
            const caseId = caseCard.dataset.caseId;
            openCase(caseId);
        });
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(tb => {
                tb.classList.remove('border-b-2', 'border-nebula-500');
                tb.classList.add('text-white/70');
            });
            
            btn.classList.add('border-b-2', 'border-nebula-500');
            btn.classList.remove('text-white/70');
            
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
            
            const tabId = btn.getAttribute('data-tab');
            const tabSection = document.getElementById(`${tabId}-section`);
            if (tabSection) tabSection.classList.remove('hidden');
        });
    });
}

const prizeIcons = {
    10: 'https://raw.githubusercontent.com/VZXdev/code-license/refs/heads/main/icons8-%D1%80%D0%BE%D0%B1%D1%83%D0%BA%D1%81-50.png',
    50: 'https://raw.githubusercontent.com/VZXdev/code-license/refs/heads/main/icons8-%D1%80%D0%BE%D0%B1%D1%83%D0%BA%D1%81-50.png',
    100: 'https://tr.rbxcdn.com/180DAY-537c7ff6cdaf34946aa8b00a778a0be0/420/420/FaceAccessory/Webp/noFilter',
    300: 'https://tr.rbxcdn.com/180DAY-c21c0525207f1c19c20f480907db6788/420/420/Hat/Webp/noFilter',
    500: 'https://tr.rbxcdn.com/180DAY-ac668a162fb556d2cabe51448912797b/420/420/Hat/Webp/noFilter',
    900: 'https://tr.rbxcdn.com/180DAY-fc4aca60c52b86949eee58ffe830b7ab/420/420/BackAccessory/Webp/noFilter',
    1200: 'https://tr.rbxcdn.com/180DAY-9196d284b7faa7965fbd0e02deb5bdfd/420/420/Hat/Webp/noFilter',
    1500: 'https://tr.rbxcdn.com/180DAY-ffbfb5539f5c723ad9d1d265ac30ddd1/420/420/Hat/Webp/noFilter',
    1666: 'https://tr.rbxcdn.com/180DAY-3091b0fb74428ffbee4418de5d3b4bb1/420/420/FaceAccessory/Webp/noFilter',
    2000: 'https://tr.rbxcdn.com/180DAY-b54d9ce6733af5b034729000193b758c/420/420/BackAccessory/Webp/noFilter',
    3000: 'https://tr.rbxcdn.com/180DAY-11b0c570276016ed3fdfa9236e93fb3b/420/420/Hat/Webp/noFilter'
};

function getRandomIcon() {
    const iconKeys = Object.keys(prizeIcons);
    const randomKey = iconKeys[Math.floor(Math.random() * iconKeys.length)];
    return prizeIcons[randomKey];
}

function updateRecentWinsDisplay() {
    const recentWinsContainer = document.getElementById('winning-ticker');
    if (!recentWinsContainer) return;
    
    const winElement = document.createElement('div');
    winElement.className = 'recent-win-item';
    
    const randomIcon = getRandomIcon();
    
    winElement.innerHTML = `
        <img src="${randomIcon}" class="w-8 h-8 rounded-full">
    `;
    
    recentWinsContainer.insertBefore(winElement, recentWinsContainer.firstChild);
    
    if (recentWinsContainer.children.length > 10) {
        recentWinsContainer.removeChild(recentWinsContainer.lastChild);
    }
}

async function updateWinningTicker() {
    try {
        const ticker = document.getElementById('winning-ticker');
        if (!ticker) return;
        
        const tickerItems = recentWins.map(win => {
            const icon = getRandomIcon();
            return `<img src="${icon}" class="w-8 h-8">`;
        }).join('');
        
        ticker.innerHTML = recentWins.length > 0 
            ? tickerItems + tickerItems 
            : '<div class="text-white/50">No recent wins yet</div>';
    } catch (error) {
        console.error('Ticker update error:', error);
    }
}

async function checkAuth() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            updateUI(user);
            
            if (user.balance <= 0) {
                showNotification('info', 'Welcome! Purchase tokens to start opening cases');
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
    }
}

async function loadInventory() {
    try {
        const response = await fetch('/api/inventory', {
            credentials: 'include'
        });

        if (response.ok) {
            const items = await response.json();
            const grid = document.getElementById('grid');
            if (!grid) return;

            grid.innerHTML = items
                .filter(item => item.robux_amount > 0)
                .map(item => `
                    <div class="glass-effect rounded-lg p-4 text-center bg-cosmic-700">
                        <div class="w-full h-24 mb-2 flex items-center justify-center">
                            <img src="${item.icon_url || 'https://placehold.co/100'}" 
                                 class="w-16 h-16 object-cover rounded-full"
                                 onerror="this.src='https://placehold.co/100'">
                        </div>
                        <h3 class="font-medium">${item.item_name || `${item.robux_amount} Robux`}</h3>
                        <p class="text-star-500 text-sm mt-1">${item.robux_amount} Robux</p>
                        <button class="btn-primary withdraw-btn mt-3 px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-nebula-500 to-star-500"
                            data-inventory-id="${item.id}" data-robux-amount="${item.robux_amount}">
                            <i class="fas fa-arrow-right mr-1"></i>
                            PayOut
                        </button>
                    </div>
                `).join('');

            grid.querySelectorAll('.withdraw-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const inventoryId = btn.dataset.inventoryId;
                    const robuxAmount = btn.dataset.robuxAmount;
                    
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Processing...';
                    
                    try {
                        const response = await fetch('/api/withdraw', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({ 
                                inventoryId,
                                robuxAmount: parseInt(robuxAmount)
                            })
                        });
                        
                        const result = await response.json();
                        if (response.ok) {
                            showNotification('success', result.message || 'Robux sent!');
                            loadInventory(); // Перезагружаем инвентарь
                        } else {
                            showNotification('error', result.message || 'Withdrawal failed');
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fas fa-arrow-right mr-1"></i> PayOut';
                        }
                    } catch (error) {
                        showNotification('error', 'Network error. Please try again.');
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fas fa-arrow-right mr-1"></i> PayOut';
                    }
                });
            });
        }
    } catch (error) {
        showNotification('error', 'Failed to load inventory');
    }
}

function updateUI(user) {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const balanceElement = document.getElementById('balance');
    const avatarElement = document.getElementById('user-avatar');
    const usernameElement = document.getElementById('username');
    
    if (!loginBtn || !userInfo || !balanceElement || !avatarElement || !usernameElement) return;
    
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    usernameElement.textContent = user.username;
    avatarElement.src = user.avatar || 'https://via.placeholder.com/40';
    balanceElement.textContent = `${user.balance} tokens`;
    
    document.querySelectorAll('.case-card').forEach(card => {
        card.style.marginBottom = '20px';
    });
    
    document.querySelectorAll('.open-case').forEach(btn => {
        btn.disabled = false;
        btn.textContent = 'Open Case';
    });
}

function logout() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'include'
    }).then(() => {
        currentUser = null;
        const loginBtn = document.getElementById('login-btn');
        const userInfo = document.getElementById('user-info');
        const inventorySection = document.getElementById('inventory-section');
        
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (inventorySection) inventorySection.classList.add('hidden');
        
        window.location.reload(); 
    }).catch(err => {
        console.error('Logout error:', err);
    });
}

async function openCase(caseId) {
    if (!currentUser) {
        showNotification('warning', 'Please login first');
        return;
    }
    
    try {
        const response = await fetch('/api/open-case', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ caseId: Number(caseId) })
        });

        if (!response.ok) {
            const error = await response.json();
            showNotification('error', error.message);
            return;
        }

        const result = await response.json();
        
        // Update balance even if item is null
        if (result.newBalance !== undefined) {
            currentUser.balance = result.newBalance;
            updateBalanceDisplay();
        }

        const prizeDisplay = document.getElementById('prize-display');
        const prizeContent = document.getElementById('prize-content');
        if (!prizeDisplay || !prizeContent) {
            showNotification('error', 'Prize display not found');
            return;
        }

        // Create default item if result.item is null
        const item = result.item || {
            icon: 'https://free-png.ru/wp-content/uploads/2022/01/free-png.ru-388.png',
            label: 'Nothing',
            value: 0
        };

        const trackLength = 70;
        const centerIndex = Math.floor(trackLength / 2);
        const prizeWidth = 176;
        const viewportCenter = window.innerWidth / 2;
        const offset = -((centerIndex * prizeWidth) - viewportCenter + (prizeWidth / 2));

        prizeContent.innerHTML = `
            <div class="case-battle-track-container" style="position:relative; width:100%; max-width:900px; margin:0 auto 32px auto; height:180px; overflow:hidden;">
                <div class="case-battle-arrow" style="transform:translateX(-50%) rotate(180deg);"></div>
                <div class="case-battle-track" id="caseBattleTrack" style="display:flex;align-items:center;height:180px;transition:transform 4s cubic-bezier(0.22,0.61,0.36,1);will-change:transform;">
                    ${Array(trackLength).fill(0).map((_, i) => `
                        <div class="case-battle-prize ${i === centerIndex ? 'winner' : ''}" style="
                            width:160px;
                            height:160px;
                            aspect-ratio:1/1;
                            background:rgba(26,26,46,0.8);
                            box-shadow:0 2px 24px #9d4edd33;
                            display:flex;
                            flex-direction:column;
                            align-items:center;
                            justify-content:center;
                            font-size:3.2rem;
                            font-weight:700;
                            color:#fff;
                            position:relative;
                            transition:border-color 0.3s;
                            border-radius:18px;
                            margin:0 8px;
                        ">
                            <img src="${item.icon}" class="case-battle-prize-icon" style="width:64px; height:64px; margin-bottom:8px;" onerror="this.src='https://placehold.co/100'">
                            <div class="case-battle-prize-label" style="font-size:1.3rem;font-weight:600;color:#f9c74f;margin-top:8px;">${item.label}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <h3 class="text-xl font-bold mb-2">Opening Case...</h3>
        `;

        prizeDisplay.classList.remove('hidden');
        prizeDisplay.classList.add('show');

        const track = document.getElementById('caseBattleTrack');
        if (!track) return;

        setTimeout(() => {
            track.style.transform = `translateX(${offset}px)`;

            setTimeout(() => {
                const prizeElems = track.querySelectorAll('.case-battle-prize');
                if (prizeElems[centerIndex]) {
                    prizeElems[centerIndex].style.borderColor = '#f9c74f';
                    prizeElems[centerIndex].style.boxShadow = '0 0 40px #f9c74f88';
                }

                setTimeout(() => {
                    prizeContent.innerHTML = `
                        <div class="prize-item prize-won" style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
                            <div style="display:flex;align-items:center;justify-content:center;width:100%;height:80px;">
                                <img src="${item.icon}" class="prize-icon" style="width:64px; height:64px;" onerror="this.src='https://placehold.co/100'">
                            </div>
                            <div class="prize-amount" style="font-size:2rem;font-weight:700;margin-top:12px;">+${item.value}</div>
                            <h3 class="prize-name" style="font-size:1.3rem;font-weight:600;margin-top:8px;">${item.label}</h3>
                            <div class="mt-6 text-lg" style="margin-top:18px;">
                                ${item.value > 0 ? 'Congratulations! You won!' : 'Better luck next time!'}
                            </div>
                        </div>
                    `;

                    if (item.value > 0) {
                        window.dispatchEvent(new CustomEvent('prize-won', {
                            detail: { amount: item.value }
                        }));
                    }

                    loadInventory();
                }, 1200);
            }, 3700);
        }, 300);
    } catch (error) {
        console.error('Error opening case:', error);
        showNotification('error', 'Failed to open case');
    }
}
function initializeSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettings = document.getElementById('close-settings');
    
    if (!settingsBtn || !settingsModal || !closeSettings) return;

    // Load saved settings
    const savedTheme = localStorage.getItem('theme') || 'cosmos';
    const savedLang = localStorage.getItem('lang') || 'en';
    
    // Apply saved settings
    document.body.setAttribute('data-theme', savedTheme);
    document.documentElement.lang = savedLang;
    updateLanguage(savedLang);
    
    // Mark active buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const theme = btn.dataset.theme;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    });
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (btn.dataset.lang === savedLang) {
            btn.classList.add('active');
        }
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const lang = btn.dataset.lang;
            document.documentElement.lang = lang;
            localStorage.setItem('lang', lang);
            updateLanguage(lang);
        });
    });
    
    // Modal controls
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
    
    // Close modal when clicking outside
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}

// В файле u2uwl2jamdinterface.js
async function loadCases() {
    try {
        const response = await fetch('/api/cases');
        const cases = await response.json();
        
        const casesGrid = document.querySelector('.cases-grid');
        if (!casesGrid) return;
        
        casesGrid.innerHTML = '';

        for (const caseItem of cases) {
            const caseElement = document.createElement('div');
            caseElement.className = 'glass-effect case-card relative rounded-xl p-6 shadow-lg transition-all duration-300 overflow-hidden bg-cosmic-800';
            caseElement.setAttribute('data-case-id', caseItem.id);
            
            caseElement.innerHTML = `
                <div class="relative z-10 flex flex-col items-center">
                    <div class="glass-effect case-image w-full h-40 rounded-lg mb-4 flex items-center justify-center shadow-inner bg-cosmic-700">
                        <img src="${caseItem.icon_url}" class="w-22 h-22 text-white object-contain">
                        <div class="glass-effect absolute bottom-2 right-2 text-white text-xs px-2 py-1 rounded-full bg-cosmic-600">
                            <i class="fas fa-fire text-star-600 mr-1"></i> Case
                        </div>
                    </div>
                    <h3 class="text-xl font-bold mb-1">${caseItem.name}</h3>
                    <p class="text-white/70 mb-4">${caseItem.description || ''}</p>
                    <div class="flex items-center justify-between w-full">
                        <span class="text-star-500 font-bold flex items-center">
                            <i class="fas fa-coins mr-1"></i> ${caseItem.price}
                        </span>
                        <button class="btn-primary open-case px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 bg-gradient-to-r from-nebula-500 to-star-500">
                            <i class="fas fa-lock-open mr-1"></i> Open
                        </button>
                    </div>
                </div>
            `;

            const openButton = caseElement.querySelector('.open-case');
            openButton.addEventListener('click', () => openCase(caseItem.id));

            casesGrid.appendChild(caseElement);
        }

    } catch (error) {
        console.error('Error loading cases:', error);
        showNotification('error', 'Failed to load cases');
    }
}
function updateLanguage(lang) {
    const elements = document.querySelectorAll('[data-translate]');
    elements.forEach(element => {
        const key = element.dataset.translate;
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateWinningTicker();
    setupEventListeners();
    checkAuth();
    loadInventory();
    initializeSettings();
    loadCases();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') && urlParams.get('login') === 'success') {
        showNotification('success', 'Successfully logged in!');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    setInterval(updateWinningTicker, 3000);
    
    window.addEventListener('prize-won', (e) => {
        recentWins.unshift({
            id: Date.now(),
            username: currentUser?.username,
            avatar: currentUser?.avatar,
            amount: e.detail.amount,
            timestamp: new Date().toISOString()
        });
        updateWinningTicker();
    });
    
    // Clean up payment monitoring on page unload
    window.addEventListener('beforeunload', () => {
        stopPaymentMonitoring();
    });
    
    // Add console logging for debugging
    console.log('Interface initialized with unique gamepass system');
    const savedLang = localStorage.getItem('lang') || 'en';
    document.documentElement.lang = savedLang;
    updateLanguage(savedLang);
});
