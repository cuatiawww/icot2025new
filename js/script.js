document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Supabase
    let supabase;
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(
            'https://wunktcfckyvkiwpisoxp.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmt0Y2Zja3l2a2l3cGlzb3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzAzMTQsImV4cCI6MjA1NDYwNjMxNH0.aPB3Vduz9ugxkT0aoBAG4kv2hD4ZX6iA7yNBTjYr07s'
        );
        console.log('Supabase client initialized successfully');
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        // Show error notification
        showNotification('Failed to connect to database. Please try refreshing the page.', 'error');
    }

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    
    if (menuToggle && mobileMenu && menuIcon) {
        menuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
            
            // Toggle menu icon between bars and X
            if (mobileMenu.classList.contains('active')) {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            } else {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    }
    
    // Scroll to section functionality for both desktop and mobile nav
    const scrollLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            scrollToSection(sectionId);
            
            // Close mobile menu if open
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            }
        });
    });
    
    // Function to scroll to a section
    function scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Navbar background change on scroll
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 0) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Fetch speakers data from Supabase
    async function fetchSpeakers() {
        try {
            const { data, error } = await supabase
                .from('speakers')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching speakers:', error);
            showNotification('Error loading speakers data. Please try again later.', 'error');
            return [];
        }
    }
    
    // Fetch about content from Supabase
    async function fetchAboutContent() {
        try {
            const { data, error } = await supabase
                .from('about_content')
                .select('*')
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching about content:', error);
            showNotification('Error loading about content. Please try again later.', 'error');
            return null;
        }
    }
    
    // Load speakers section data
    async function loadSpeakersSection() {
        const loadingState = document.getElementById('loadingState');
        const tbaState = document.getElementById('tbaState');
        const speakersList = document.getElementById('speakersList');
        
        if (!loadingState || !tbaState || !speakersList) return;
        
        try {
            // Show loading state
            loadingState.style.display = 'flex';
            tbaState.style.display = 'none';
            speakersList.style.display = 'none';
            
            // Fetch speakers data
            const speakers = await fetchSpeakers();
            
            // Hide loading state
            loadingState.style.display = 'none';
            
            if (speakers.length === 0) {
                // Show TBA state if no speakers
                tbaState.style.display = 'block';
            } else {
                // Show speakers list and populate it
                speakersList.style.display = 'block';
                populateSpeakers(speakers);
            }
        } catch (error) {
            console.error('Error loading speakers section:', error);
            // Hide loading state and show error message
            loadingState.style.display = 'none';
            showNotification('Error loading speakers data. Please try again later.', 'error');
        }
    }
    
    // Function to populate speakers
    function populateSpeakers(speakers) {
        const speakersList = document.getElementById('speakersList');
        
        if (!speakersList) return;
        
        speakersList.innerHTML = '';
        
        speakers.forEach(speaker => {
            const speakerCard = document.createElement('div');
            speakerCard.className = 'speaker-card';
            
            speakerCard.innerHTML = `
                <div class="speaker-content">
                    <div class="speaker-profile">
                        <div class="speaker-image-container">
                            <img src="${speaker.image_url}" alt="${speaker.name}" class="speaker-image">
                        </div>
                        <div class="speaker-info">
                            <h3 class="speaker-name">${speaker.name}</h3>
                            <p class="speaker-title">${speaker.title}</p>
                            <p class="speaker-position">${speaker.position}</p>
                            <p class="speaker-affiliation">${speaker.affiliation}</p>
                        </div>
                    </div>

                    <div class="speaker-details">
                        <div class="speaker-bio">
                            <h4 class="detail-header">
                                <span class="detail-header-line"></span>
                                Biography
                            </h4>
                            <p class="detail-content">${speaker.biography}</p>
                        </div>

                        <div class="speaker-presentation">
                            <h4 class="detail-header">
                                <span class="detail-header-line"></span>
                                Presentation
                            </h4>
                            <h5 class="presentation-title">${speaker.presentation_title}</h5>
                            <p class="detail-content">${speaker.presentation_abstract}</p>
                        </div>
                    </div>
                </div>
            `;
            
            speakersList.appendChild(speakerCard);
        });
    }
    
    // Load about section data
    async function loadAboutSection() {
        try {
            const aboutSection = document.getElementById('about');
            if (!aboutSection) return;
            
            // Add loading indicator to the about section
            const aboutContent = aboutSection.querySelector('.about-content');
            if (aboutContent) {
                aboutContent.innerHTML = `
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">Loading content...</p>
                    </div>
                `;
            }
            
            // Fetch about content
            const content = await fetchAboutContent();
            
            if (!content) {
                // If no content, show default message
                if (aboutContent) {
                    aboutContent.innerHTML = `
                        <div class="about-text">
                            <p>Information about ICOT 2025 will be coming soon.</p>
                        </div>
                    `;
                }
                return;
            }
            
            // Update title
            const titleElement = aboutSection.querySelector('.section-title');
            if (titleElement) {
                titleElement.textContent = content.title;
            }
            
            // Update content
            if (aboutContent) {
                // Split content into paragraphs
                const paragraphs = content.content.split('\n\n');
                
                let paragraphsHtml = '';
                paragraphs.forEach((paragraph, index) => {
                    paragraphsHtml += `
                        <p class="${index === 0 ? 'first-paragraph' : ''}">${paragraph}</p>
                    `;
                });
                
                aboutContent.innerHTML = `
                    <div class="about-text">
                        ${paragraphsHtml}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading about section:', error);
            showNotification('Error loading about content. Please try again later.', 'error');
        }
    }
    
    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add close button functionality
        const closeButton = notification.querySelector('.notification-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            });
        }
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Load all section data
    if (supabase) {
        loadSpeakersSection();
        loadAboutSection();
        // Add more section loading functions here as needed
    }
});