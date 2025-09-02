function showNotification(type, message, duration = 3000) {
            const container = document.getElementById('notification-container');
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
