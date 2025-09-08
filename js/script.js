document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    window.initSupabase().then(client => {
        console.log('Supabase client initialized in script.js');
        window.supabase = client;
        setTimeout(() => {
            if (typeof window.loadAllSections === 'function') {
                console.log('Calling loadAllSections from script.js');
                window.loadAllSections();
            } else {
                console.error('loadAllSections function not found!');
            }
        }, 200);
    }).catch(error => {
        console.error('Failed to initialize Supabase in script.js:', error);
        window.showNotification('Failed to connect to database. Please try refreshing the page.', 'error');
    });

    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    
    if (menuToggle && mobileMenu && menuIcon) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            if (mobileMenu.classList.contains('active')) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }
    
    const sectionLinks = document.querySelectorAll('.nav-link[data-section], .mobile-nav-link[data-section]');
    sectionLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            scrollToSection(sectionId);
            
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    });
    
    const registrationLinks = document.querySelectorAll('a.registration-link');
    registrationLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    });
    
    function scrollToSection(sectionId) {
        if (sectionId === 'home') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }
    
    const navbar = document.getElementById('navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 0) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    };
    
    function handleHashNavigation() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            setTimeout(() => {
                scrollToSection(hash);
            }, 500);
        }
    }
    
    handleHashNavigation();
    
    window.addEventListener('hashchange', handleHashNavigation);
});