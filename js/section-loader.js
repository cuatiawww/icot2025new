// section-loader.js
// A utility script to load all section content in the correct order

document.addEventListener('DOMContentLoaded', async function() {
    let supabase;
    
    try {
        // Initialize Supabase client
        supabase = window.initSupabase();
        console.log('Supabase client initialized');
    } catch (error) {
        console.error('Error initializing Supabase client:', error);
        showNotification('Failed to connect to database. Please try refreshing the page.', 'error');
        return;
    }
    
    // Get hero section as reference
    const heroSection = document.getElementById('home');
    
    // Define sections in the order they should appear
    const sections = [
        { id: 'about', title: 'About ICOT 2025', init: loadAboutSection },
        { id: 'speakers', title: 'Keynote Speakers', init: loadSpeakersSection },
        { id: 'committee', title: 'Organizing Committee', init: loadCommitteeSection },
        { id: 'program', title: 'Program Schedule', init: loadProgramSection },
        { id: 'dates', title: 'Important Dates', init: loadDatesSection },
        { id: 'papers', title: 'Call For Papers', init: loadPapersSection },
        { id: 'submission', title: 'Paper Submission', init: loadSubmissionSection },
        { id: 'registration', title: 'Registration', init: loadRegistrationSection }
    ];
    
    // Initialize sections in order
    let prevSection = heroSection;
    for (const section of sections) {
        // Remove existing section if it's in the wrong position
        const existingSection = document.getElementById(section.id);
        if (existingSection) {
            existingSection.remove();
        }
        
        // Create and position the section
        await section.init(supabase, prevSection);
        
        // Update reference for next section
        prevSection = document.getElementById(section.id) || prevSection;
    }
});

// Helper function to insert a section after another section
function insertAfter(newNode, referenceNode) {
    if (referenceNode.nextSibling) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    } else {
        referenceNode.parentNode.appendChild(newNode);
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

/**
 * Load About Section data from Supabase
 */
async function loadAboutSection(supabase, prevSection) {
    const sectionId = 'about';
    
    try {
        // Create about section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'about-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">About ICOT 2025</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="about-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Fetch data from Supabase
        const { data, error } = await supabase
            .from('about_content')
            .select('*')
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the error code for no rows returned
        
        // Get content element
        const contentElement = section.querySelector('.about-content');
        
        // If no data, show placeholder
        if (!data) {
            contentElement.innerHTML = `
                <div class="about-text">
                    <p>Information about ICOT 2025 will be coming soon.</p>
                </div>
            `;
            return;
        }
        
        // Update title if exists
        const titleElement = section.querySelector('.section-title');
        if (titleElement && data.title) {
            titleElement.textContent = data.title;
        }
        
        // Update content
        if (data.content) {
            // Split content into paragraphs
            const paragraphs = data.content.split('\n\n');
            
            let paragraphsHtml = '<div class="about-text">';
            paragraphs.forEach((paragraph, index) => {
                paragraphsHtml += `
                    <p class="${index === 0 ? 'first-paragraph' : ''}">${paragraph}</p>
                `;
            });
            paragraphsHtml += '</div>';
            
            contentElement.innerHTML = paragraphsHtml;
        } else {
            contentElement.innerHTML = '<p class="placeholder-text">About content coming soon.</p>';
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.about-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}

/**
 * Load Speakers Section data from Supabase
 */
async function loadSpeakersSection(supabase, prevSection) {
    const sectionId = 'speakers';
    
    try {
        // Create speakers section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'speakers-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Keynote Speakers</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="speakers-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content container
        const contentContainer = section.querySelector('.speakers-content');
        
        // Fetch speakers from Supabase
        const { data: speakers, error } = await supabase
            .from('speakers')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        if (!speakers || speakers.length === 0) {
            // No speakers found - show TBA state in the exact style from screenshot
            contentContainer.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Our keynote speakers will be announced soon.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create speakers list HTML
        let speakersHtml = '<div class="speakers-list">';
        
        speakers.forEach(speaker => {
            speakersHtml += `
                <div class="speaker-card">
                    <div class="speaker-content">
                        <div class="speaker-profile">
                            <div class="speaker-image-container">
                                <img src="${speaker.image_url}" alt="${speaker.name}" class="speaker-image">
                            </div>
                            <div class="speaker-info">
                                <h3 class="speaker-name">${speaker.name}</h3>
                                <p class="speaker-title">${speaker.title || ''}</p>
                                <p class="speaker-position">${speaker.position || ''}</p>
                                <p class="speaker-affiliation">${speaker.affiliation || ''}</p>
                            </div>
                        </div>

                        <div class="speaker-details">
                            <div class="speaker-bio">
                                <h4 class="detail-header">
                                    <span class="detail-header-line"></span>
                                    Biography
                                </h4>
                                <p class="detail-content">${speaker.biography || 'Biography coming soon.'}</p>
                            </div>

                            <div class="speaker-presentation">
                                <h4 class="detail-header">
                                    <span class="detail-header-line"></span>
                                    Presentation
                                </h4>
                                <h5 class="presentation-title">${speaker.presentation_title || 'To Be Announced'}</h5>
                                <p class="detail-content">${speaker.presentation_abstract || 'Abstract coming soon.'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        speakersHtml += '</div>';
        
        // Update content
        contentContainer.innerHTML = speakersHtml;
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentContainer = section.querySelector('.speakers-content');
            
            if (contentContainer) {
                contentContainer.innerHTML = createErrorHTML();
            }
        }
    }
}

/**
 * Load Committee Section data from Supabase
 */
async function loadCommitteeSection(supabase, prevSection) {
    const sectionId = 'committee';
    
    try {
        // Create committee section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'committee-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Organizing Committee</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="committee-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.committee-content');
        
        // Fetch committee categories from Supabase
        const { data: categoriesData, error: categoriesError } = await supabase
            .from('committee_categories')
            .select('*')
            .order('order_number');
            
        if (categoriesError) throw categoriesError;
        
        // If no categories, show TBA section exactly like in the screenshot
        if (!categoriesData || categoriesData.length === 0) {
            contentElement.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Our organizing committee will be announced soon.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
            return;
        }
        
        // Fetch members for each category
        const categoriesWithMembers = await Promise.all(
            categoriesData.map(async (category) => {
                const { data: membersData, error: membersError } = await supabase
                    .from('committee_members')
                    .select('*')
                    .eq('category_id', category.id)
                    .order('order_number');
                
                if (membersError) throw membersError;
                
                return {
                    ...category,
                    members: membersData || []
                };
            })
        );
        
        // Create HTML for committee categories
        let categoriesHtml = '<div class="committee-categories">';
        
        // Add each category
        categoriesWithMembers.forEach(category => {
            categoriesHtml += `
                <div class="committee-category">
                    <div class="category-header">
                        <h3 class="category-title">${category.title}</h3>
                    </div>
                    
                    <div class="category-content">
                        <div class="members-grid">
            `;
            
            // Add each member
            category.members.forEach(member => {
                categoriesHtml += `
                    <div class="committee-member">
                        <h4 class="member-name">${member.name}</h4>
                        <p class="member-affiliation">${member.affiliation || ''}</p>
                    </div>
                `;
            });
            
            categoriesHtml += `
                        </div>
                    </div>
                </div>
            `;
        });
        
        categoriesHtml += '</div>';
        
        // Update content
        contentElement.innerHTML = categoriesHtml;
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.committee-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}

/**
 * Load Program Section data from Supabase
 */
async function loadProgramSection(supabase, prevSection) {
    const sectionId = 'program';
    
    try {
        // Create program section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'program-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Program Schedule</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="program-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.program-content');
        
        // Fetch program schedule from Supabase
        const { data, error } = await supabase
            .from('program_schedules')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the error code for no rows returned
        
        // If no schedule, show TBA section exactly like in the screenshot
        if (!data) {
            contentElement.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Program schedule will be announced closer to the conference date.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create HTML for program schedule with PDF viewer
        const scheduleHtml = `
            <div class="program-schedule-container">
                <div class="program-header">
                    <h3 class="program-title">${data.title}</h3>
                    
                        href="${data.pdf_url}"
                        download
                        class="download-button"
                    >
                        <svg
                            class="download-icon"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fill-rule="evenodd"
                                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                                clip-rule="evenodd"
                            />
                        </svg>
                        Download PDF
                    </a>
                </div>

                <div class="pdf-container">
                    <iframe
                        src="${data.pdf_url}#toolbar=0"
                        class="pdf-viewer"
                        title="Program Schedule PDF"
                    ></iframe>
                </div>
            </div>
        `;
        
        // Update content
        contentElement.innerHTML = scheduleHtml;
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.program-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}

/**
 * Load Dates Section data 
 */
async function loadDatesSection(supabase, prevSection) {
    const sectionId = 'dates';
    
    try {
        // Create dates section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'dates-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Important Dates</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="dates-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.dates-content');
        
        // Static dates data
        // In a real app, you would fetch this from Supabase
        const dates = [
            {
                label: "Full Paper Submission",
                date: "30 Juni 2025",
                type: "deadline"
              },
              {
                label: "Notification of Acceptance",
                date: "31 Juli 2025",
                type: "normal" 
              },
              {
                label: "Camera Ready Paper Submission",
                date: "15 September 2025",
                type: "normal"
              },
              {
                label: "Early Bird Registration",
                date: "20 - 30 September 2025",
                type: "normal"
              },
              {
                label: "Registration Deadline",
                date: "18 October 2025",
                type: "normal"
              },
              {
                label: "Conference",
                date: "27-30 October 2025",
                type: "highlight"
              }
        ];
        
        // Create HTML for timeline
        let timelineHtml = `
            <div class="dates-container">
                <div class="timeline-container">
                    <!-- Timeline line -->
                    <div class="timeline-line"></div>
                    <div class="timeline-items">
        `;
        
        // Add each date to the timeline
        dates.forEach((item, index) => {
            timelineHtml += `
                <div class="timeline-item ${item.type}">
                    <!-- Timeline dot -->
                    <div class="timeline-dot ${item.type}"></div>
                    <div class="timeline-content">
                        <div class="timeline-label">${item.label}</div>
                        <div class="timeline-date">${item.date}</div>
                    </div>
                </div>
            `;
        });
        
        // Close the timeline HTML
        timelineHtml += `
                    </div>
                </div>
            </div>
        `;
        
        // Update content
        contentElement.innerHTML = timelineHtml;
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.dates-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}

/**
 * Load Papers Section data from Supabase
 */
async function loadPapersSection(supabase, prevSection) {
    const sectionId = 'papers';
    
    try {
        // Create section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'papers-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Call For Papers</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="papers-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.papers-content');
        
        // For now, just display TBA
        setTimeout(() => {
            contentElement.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Call for papers information will be available soon.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
        }, 500);
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector('.papers-content');
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

/**
 * Load Submission Section data from Supabase
 */
async function loadSubmissionSection(supabase, prevSection) {
    const sectionId = 'submission';
    
    try {
        // Create section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'submission-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Paper Submission</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="submission-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.submission-content');
        
        // For now, just display TBA
        setTimeout(() => {
            contentElement.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Submission guidelines will be available soon.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
        }, 500);
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector('.submission-content');
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

/**
 * Load Registration Section data from Supabase
 */
async function loadRegistrationSection(supabase, prevSection) {
    const sectionId = 'registration';
    
    try {
        // Create section element
        const section = document.createElement('section');
        section.id = sectionId;
        section.className = 'registration-section';
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">Registration</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="registration-content">
                    ${createLoadingHTML()}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
        // Get content element
        const contentElement = section.querySelector('.registration-content');
        
        // For now, just display TBA
        setTimeout(() => {
            contentElement.innerHTML = `
                <div class="tba-content">
                    <h2 class="tba-main-title">To Be Announced</h2>
                    <p class="tba-description">Registration details will be available closer to the conference date.</p>
                    <div class="tba-icon-container">
                        <svg class="tba-icon" fill="#f97316" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                            <path d="M0 0h24v24H0z" fill="none"/>
                            <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                        </svg>
                    </div>
                </div>
            `;
        }, 500);
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector('.registration-content');
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

// Utility Functions

/**
 * Create loading HTML
 */
function createLoadingHTML() {
    return `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p class="loading-text">Loading content...</p>
        </div>
    `;
}

/**
 * Create error HTML
 */
function createErrorHTML() {
    return `
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <p class="error-text">Failed to load content. Please try again later.</p>
        </div>
    `;
}

/**
 * Create a section skeleton
 */
function createSectionSkeleton(id, title, className) {
    const section = document.createElement('section');
    section.id = id;
    section.className = className || '';
    
    section.innerHTML = `
        <div class="section-container">
            <div class="section-header">
                <h2 class="section-title">${title}</h2>
                <div class="section-divider"></div>
            </div>
            <div class="${id}-content">
                ${createLoadingHTML()}
            </div>
        </div>
    `;
    
    return section;
}