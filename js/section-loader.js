// section-loader.js - Handles loading all dynamic sections for ICOT 2025 website
document.addEventListener('DOMContentLoaded', function() {
    console.log('Section loader initialized');
    
    // We will not auto-load sections here - wait for Supabase to be ready
    // The loading will be triggered from script.js after Supabase is initialized
});

// Make loadAllSections available globally
window.loadAllSections = loadAllSections;

// Main function to load all sections
async function loadAllSections() {
    console.log('Starting to load all sections');
    let supabase;
    
    try {
        // Use the already initialized Supabase client
        if (window.supabase) {
            supabase = window.supabase;
            console.log('Using existing Supabase client in section-loader');
        } else {
            console.log('No Supabase client found, initializing one');
            try {
                supabase = await window.initSupabase();
            } catch (error) {
                console.error('Failed to initialize Supabase:', error);
                handleStaticSections();
                return;
            }
        }
    } catch (error) {
        console.error('Error getting Supabase client:', error);
        window.showNotification('Failed to connect to database. Please try refreshing the page.', 'error');
        handleStaticSections();
        return;
    }
    
    // Get hero section as reference
    const heroSection = document.getElementById('home');
    if (!heroSection) {
        console.error('Hero section not found');
        return;
    }
    
    // Get about section as reference (should be static HTML)
    const aboutSection = document.getElementById('about');
    
    // Define the reference section (where to start adding new sections)
    let prevSection = aboutSection || heroSection;
    
    // Define sections in the order they should appear
    const sections = [
        { id: 'speakers', title: 'Keynote Speakers', load: loadSpeakersSection },
        { id: 'invited-speakers', title: 'Invited Speakers', load: loadInvitedSpeakersSection }, // New section
        { id: 'committee', title: 'Organizing Committee', load: loadCommitteeSection },
        { id: 'program', title: 'Program Schedule', load: loadSimpleTbaSection },
        { id: 'dates', title: 'Important Dates', load: loadDatesSection },
        { id: 'papers', title: 'Call For Papers', load: loadPapersSection },
        
        { id: 'submission', title: 'Paper Submission', load: loadSimpleTbaSection },
        { id: 'registration', title: 'Registration', load: loadSimpleTbaSection }
    ];
    
    // Load each section in sequence
    for (const section of sections) {
        // Skip if section already exists
        const existingSection = document.getElementById(section.id);
        if (existingSection) {
            console.log(`Section ${section.id} already exists, replacing content`);
            
            // For existing sections, update their content
            try {
                await section.load(supabase, existingSection, true);
                prevSection = existingSection;
            } catch (error) {
                console.error(`Error updating existing section ${section.id}:`, error);
                
                // Reset to TBA state if error occurs
                const contentContainer = existingSection.querySelector(`.${section.id}-content`);
                if (contentContainer) {
                    contentContainer.innerHTML = createTbaHTML(section.id, section.title);
                }
            }
            
            continue;
        }
        
        // Create and load new section
        try {
            console.log(`Loading new section: ${section.id}`);
            await section.load(supabase, prevSection);
            
            // Update reference for next section
            const newSection = document.getElementById(section.id);
            if (newSection) {
                prevSection = newSection;
                console.log(`Successfully loaded section: ${section.id}`);
            } else {
                console.warn(`Section ${section.id} was not created properly`);
            }
        } catch (error) {
            console.error(`Error loading section ${section.id}:`, error);
        }
    }
    
    console.log('All sections loaded or updated');
}

// Handle static sections if Supabase fails
function handleStaticSections() {
    const staticSections = ['committee', 'program', 'dates', 'papers', 'submission', 'registration'];
    
    staticSections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const contentContainer = section.querySelector(`.${sectionId}-content`);
            if (contentContainer && contentContainer.querySelector('.loading-container')) {
                contentContainer.innerHTML = createTbaHTML(sectionId);
            }
        }
    });
}

// Helper function to insert a section after another section
function insertAfter(newNode, referenceNode) {
    if (!referenceNode) {
        console.error('Reference node is null or undefined');
        return;
    }
    
    if (referenceNode.nextSibling) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    } else {
        referenceNode.parentNode.appendChild(newNode);
    }
}

/**
 * Load Invited Speakers Section data from Supabase
 */
async function loadInvitedSpeakersSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'invited-speakers';
    
    try {
        let section;
        let contentContainer;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentContainer = section.querySelector('.invited-speakers-content');
            
            if (contentContainer) {
                contentContainer.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing invited speakers section');
                return;
            }
        } else {
            // Create invited speakers section element
            section = document.createElement('section');
            section.id = sectionId;
            section.className = 'invited-speakers-section';
            section.innerHTML = `
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title">Invited Speakers</h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="invited-speakers-content">
                        ${createLoadingHTML()}
                    </div>
                </div>
            `;
            
            // Insert after previous section
            insertAfter(section, prevSection);
            contentContainer = section.querySelector('.invited-speakers-content');
        }
        
        console.log('Fetching invited speakers data from Supabase');
        
        try {
            // Fetch invited speakers from Supabase
            const { data: speakers, error } = await supabase
                .from('invited_speakers') // Create this table in Supabase
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) {
                console.error('Error fetching invited speakers:', error);
                throw error;
            }
            
            if (!speakers || speakers.length === 0) {
                console.log('No invited speakers found, showing TBA state');
                // No speakers found - show TBA state
                contentContainer.innerHTML = createTbaHTML('invited-speakers', 'Invited Speakers');
                return;
            }
            
            console.log(`Found ${speakers.length} invited speakers, rendering them`);
            
            // Create speakers list HTML
            let speakersHtml = '<div class="speakers-list invited-list">';
            
            speakers.forEach(speaker => {
                speakersHtml += `
                    <div class="speaker-card">
                        <div class="speaker-content">
                            <div class="speaker-profile">
                                <div class="speaker-image-container">
                                    <img src="${speaker.image_url || 'https://placehold.co/400x400/orange/white?text=Speaker'}" alt="${speaker.name}" class="speaker-image">
                                </div>
                                <div class="speaker-info">
                                    <h3 class="speaker-name">${speaker.name || 'TBA'}</h3>
                                    <p class="speaker-title invited">${speaker.title || 'Invited Speaker'}</p>
                                    <p class="speaker-position">${speaker.position || ''}</p>
                                    <p class="speaker-affiliation">${speaker.affiliation || ''}</p>
                                </div>
                            </div>

                            <div class="speaker-details">
                                <div class="speaker-bio">
                                    <h4 class="detail-header">
                                        Biography
                                    </h4>
                                    <p class="detail-content">${speaker.biography || 'Biography coming soon.'}</p>
                                </div>

                                <div class="speaker-presentation">
                                    <h4 class="detail-header">
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
            console.log('Invited speakers section rendered successfully');
            
        } catch (error) {
            console.error('Error in Supabase query for invited speakers:', error);
            // Show TBA state in case of any error
            contentContainer.innerHTML = createTbaHTML('invited-speakers', 'Invited Speakers');
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentContainer = section.querySelector('.invited-speakers-content');
            
            if (contentContainer) {
                contentContainer.innerHTML = createErrorHTML();
            }
        }
    }
}

/**
 * Load Speakers Section data from Supabase with enhanced modal biographies
 */
async function loadSpeakersSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'speakers';
    
    try {
        let section;
        let contentContainer;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentContainer = section.querySelector('.speakers-content');
            
            if (contentContainer) {
                contentContainer.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing speakers section');
                return;
            }
        } else {
            // Create speakers section element
            section = document.createElement('section');
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
                
                <!-- Enhanced Modal for speaker biography -->
                <div id="speakerBioModal" class="speaker-modal">
                    <div class="speaker-modal-content">
                        <div class="speaker-modal-header">
                            <h3 class="speaker-modal-title">Speaker Biography</h3>
                            <span class="speaker-modal-close">&times;</span>
                        </div>
                        <div class="speaker-modal-body">
                            <div class="speaker-modal-profile">
                                <div class="speaker-modal-image"></div>
                                <div class="speaker-modal-info">
                                    <h3 class="speaker-modal-name"></h3>
                                    <p class="speaker-modal-position"></p>
                                    <p class="speaker-modal-affiliation"></p>
                                </div>
                            </div>
                            <div class="speaker-modal-bio-content"></div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert after previous section
            insertAfter(section, prevSection);
            contentContainer = section.querySelector('.speakers-content');
        }
        
        console.log('Fetching speakers data from Supabase');
        
        try {
            // Fetch speakers from Supabase
            const { data: speakers, error } = await supabase
                .from('speakers')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) {
                console.error('Error fetching speakers:', error);
                throw error;
            }
            
            if (!speakers || speakers.length === 0) {
                console.log('No speakers found, showing TBA state');
                // No speakers found - show TBA state
                contentContainer.innerHTML = createTbaHTML('speakers', 'Keynote Speakers');
                return;
            }
            
            console.log(`Found ${speakers.length} speakers, rendering them`);
            
            // Create speakers list HTML
            let speakersHtml = '<div class="speakers-list">';
            
            speakers.forEach((speaker, index) => {
                // Create a placeholder if no image is available
                const imageHtml = speaker.image_url 
                    ? `<img src="${speaker.image_url}" alt="${speaker.name}" class="speaker-image">`
                    : `<div class="speaker-placeholder" style="background-color: #ffab00; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                        <span style="color: white; font-size: 1.8rem; font-weight: bold;">${speaker.name.split(' ').pop()}</span>
                       </div>`;
                
                // Create a short bio version
                const shortBiography = truncateBio(speaker.biography || 'Biography coming soon.', 150);
                
                speakersHtml += `
                    <div class="speaker-card" data-speaker-index="${index}">
                        <div class="speaker-content">
                            <div class="speaker-profile">
                                <div class="speaker-image-container">
                                    ${imageHtml}
                                </div>
                                <div class="speaker-info">
                                    <h3 class="speaker-name">${speaker.name || 'TBA'}</h3>
                                    <p class="speaker-title">${speaker.title || ''}</p>
                                    <p class="speaker-position">${speaker.position || ''}</p>
                                    <p class="speaker-affiliation">${speaker.affiliation || ''}</p>
                                </div>
                            </div>

                            <div class="speaker-details">
                                <div class="speaker-bio">
                                    <h4 class="detail-header">Biography</h4>
                                    <p class="detail-content short-bio">${shortBiography}</p>
                                    <button class="bio-view-btn" data-speaker-index="${index}">Read More</button>
                                    
                                    <!-- Hidden full bio and data for modal -->
                                    <div class="hidden-speaker-data" style="display: none;">
                                        <div class="full-data">
                                            <div class="data-image">${imageHtml}</div>
                                            <div class="data-name">${speaker.name}</div>
                                            <div class="data-position">${speaker.position || ''}</div>
                                            <div class="data-affiliation">${speaker.affiliation || ''}</div>
                                            <div class="data-biography">${speaker.biography || 'Biography coming soon.'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            speakersHtml += '</div>';
            
            // Update content
            contentContainer.innerHTML = speakersHtml;
            console.log('Speakers section rendered successfully');
            
            // Initialize modal functionality
            initEnhancedSpeakerModals(speakers);
            
        } catch (error) {
            console.error('Error in Supabase query for speakers:', error);
            // Show TBA state in case of any error
            contentContainer.innerHTML = createTbaHTML('speakers', 'Keynote Speakers');
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
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

// Helper function to truncate biography text for short version
function truncateBio(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
    const truncated = text.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    
    return truncated + '...';
}

// Function to initialize enhanced modal functionality for speaker biographies
function initEnhancedSpeakerModals(speakers) {
    // Get modal element
    const modal = document.getElementById('speakerBioModal');
    const modalImage = modal.querySelector('.speaker-modal-image');
    const modalName = modal.querySelector('.speaker-modal-name');
    const modalPosition = modal.querySelector('.speaker-modal-position');
    const modalAffiliation = modal.querySelector('.speaker-modal-affiliation');
    const modalBioContent = modal.querySelector('.speaker-modal-bio-content');
    const closeBtn = modal.querySelector('.speaker-modal-close');
    
    // Get all bio view buttons
    const bioViewBtns = document.querySelectorAll('.bio-view-btn');
    
    // Add click event to all bio view buttons
    bioViewBtns.forEach(button => {
        button.addEventListener('click', function() {
            // Get speaker index
            const speakerIndex = parseInt(this.getAttribute('data-speaker-index'));
            
            // Find the hidden data
            const speakerCard = this.closest('.speaker-card');
            const hiddenData = speakerCard.querySelector('.hidden-speaker-data .full-data');
            
            // Get data from hidden element
            const image = hiddenData.querySelector('.data-image').innerHTML;
            const name = hiddenData.querySelector('.data-name').textContent;
            const position = hiddenData.querySelector('.data-position').textContent;
            const affiliation = hiddenData.querySelector('.data-affiliation').textContent;
            const biography = hiddenData.querySelector('.data-biography').textContent;
            
            // Set modal content
            modalImage.innerHTML = image;
            modalName.textContent = name;
            modalPosition.textContent = position;
            modalAffiliation.textContent = affiliation;
            
            // Format biography with paragraphs
            const formattedBio = formatBiographyText(biography);
            modalBioContent.innerHTML = formattedBio;
            
            // Show modal
            modal.style.display = 'block';
            document.body.classList.add('modal-open'); // Add class to prevent background scrolling
        });
    });
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });
}

// Helper function to format biography text with proper paragraphs
function formatBiographyText(text) {
    if (!text) return '';
    
    // Replace double line breaks with paragraph tags
    return text.split('\n\n')
        .filter(paragraph => paragraph.trim() !== '')
        .map(paragraph => `<p>${paragraph.trim()}</p>`)
        .join('');
}

// Helper function to truncate biography text for short version
function truncateBio(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
    const truncated = text.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    
    return truncated + '...';
}

// Function to initialize modal functionality for speaker biographies
function initSpeakerModals() {
    // Get modal element
    const modal = document.getElementById('speakerBioModal');
    const modalBody = modal.querySelector('.speaker-modal-body');
    const closeBtn = modal.querySelector('.speaker-modal-close');
    
    // Get all bio view buttons
    const bioViewBtns = document.querySelectorAll('.bio-view-btn');
    
    // Add click event to all bio view buttons
    bioViewBtns.forEach(button => {
        button.addEventListener('click', function() {
            // Find the hidden bio content
            const speakerBio = this.closest('.speaker-bio');
            const hiddenBio = speakerBio.querySelector('.hidden-bio');
            
            // Set modal content
            modalBody.innerHTML = hiddenBio.innerHTML;
            
            // Show modal
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
        });
    });
    
    // Close modal when clicking the close button
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Re-enable scrolling
    });
    
    // Close modal when clicking outside the modal content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
    
    // Close modal with escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    });
}
// Helper function to truncate biography text for short version
function truncateBio(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    
    // Find the last space before maxLength to avoid cutting words
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
    const truncated = text.substring(0, lastSpace > 0 ? lastSpace : maxLength);
    
    return truncated + '...';
}

// Function to initialize toggle buttons for biographies
function initBioToggleButtons() {
    // Find all bio toggle buttons
    const bioToggleBtns = document.querySelectorAll('.bio-toggle-btn');
    
    // Add click event to each button
    bioToggleBtns.forEach(button => {
        button.addEventListener('click', function() {
            // Find the parent bio section
            const bioSection = this.closest('.speaker-bio');
            
            // Find short and full bio elements
            const shortBio = bioSection.querySelector('.short-bio');
            const fullBio = bioSection.querySelector('.full-bio');
            
            // Toggle visibility
            if (fullBio.style.display === 'none') {
                // Show full bio
                shortBio.style.display = 'none';
                fullBio.style.display = 'block';
                this.textContent = 'Read Less';
                this.classList.add('active');
            } else {
                // Show short bio
                shortBio.style.display = 'block';
                fullBio.style.display = 'none';
                this.textContent = 'Read More';
                this.classList.remove('active');
            }
        });
    });
}
/**
 * Load Committee Section data from Supabase
 */
async function loadCommitteeSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'committee';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector('.committee-content');
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing committee section');
                return;
            }
        } else {
            // Create committee section element
            section = document.createElement('section');
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
            contentElement = section.querySelector('.committee-content');
        }
        
        try {
            // Fetch committee categories from Supabase
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('committee_categories')
                .select('*')
                .order('order_number');
                
            if (categoriesError) {
                console.error('Error fetching committee categories:', categoriesError);
                throw categoriesError;
            }
            
            // If no categories, show TBA section
            if (!categoriesData || categoriesData.length === 0) {
                contentElement.innerHTML = createTbaHTML('committee', 'Organizing Committee');
                return;
            }
            
            // Fetch members for each category
            const categoriesWithMembers = await Promise.all(
                categoriesData.map(async (category) => {
                    try {
                        const { data: membersData, error: membersError } = await supabase
                            .from('committee_members')
                            .select('*')
                            .eq('category_id', category.id)
                            .order('order_number');
                        
                        if (membersError) {
                            console.error(`Error fetching members for category ${category.id}:`, membersError);
                            throw membersError;
                        }
                        
                        return {
                            ...category,
                            members: membersData || []
                        };
                    } catch (error) {
                        console.error(`Error processing category ${category.id}:`, error);
                        return {
                            ...category,
                            members: []
                        };
                    }
                })
            );
            
            // Create HTML for committee categories
            let categoriesHtml = '<div class="committee-categories">';
            
            // Add each category
            categoriesWithMembers.forEach(category => {
                categoriesHtml += `
                    <div class="committee-category">
                        <div class="category-header">
                            <h3 class="category-title">${category.title || 'Committee'}</h3>
                        </div>
                        
                        <div class="category-content">
                            <div class="members-grid">
                `;
                
                // Add each member
                if (category.members && category.members.length > 0) {
                    category.members.forEach(member => {
                        categoriesHtml += `
                            <div class="committee-member">
                                <h4 class="member-name">${member.name || 'TBA'}</h4>
                                <p class="member-affiliation">${member.affiliation || ''}</p>
                            </div>
                        `;
                    });
                } else {
                    categoriesHtml += `
                        <div class="committee-member">
                            <p>Members to be announced</p>
                        </div>
                    `;
                }
                
                categoriesHtml += `
                            </div>
                        </div>
                    </div>
                `;
            });
            
            categoriesHtml += '</div>';
            
            // Update content
            contentElement.innerHTML = categoriesHtml;
            
        } catch (supabaseError) {
            console.error('Supabase error in committee section:', supabaseError);
            contentElement.innerHTML = createTbaHTML('committee', 'Organizing Committee');
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.committee-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}
/**
 * Load Dates Section with static data
 */
async function loadDatesSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'dates';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector('.dates-content');
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing dates section');
                return;
            }
        } else {
            // Create dates section element
            section = document.createElement('section');
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
            contentElement = section.querySelector('.dates-content');
        }
        
        // Static dates data
        const dates = [
            {
                label: "Full Paper Submission",
                date: "30 June 2025",
                type: "deadline"
            },
            {
                label: "Notification of Acceptance",
                date: "31 July 2025",
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
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        const contentElement = section ? section.querySelector('.dates-content') : null;
        
        if (contentElement) {
            contentElement.innerHTML = createErrorHTML();
        }
    }
}

/**
 * Simple TBA section loader for sections that don't have data yet
 */async function loadSimpleTbaSection(supabase, prevSection, isExisting = false) {
    // Get the section ID from the prevSection if it's an existing section
    let sectionId;
    
    if (isExisting) {
        sectionId = prevSection.id;
    } else {
        // For new sections, determine which section type to create based on prevSection
        // Check which section comes after the prevSection in the sections array
        const sectionOrder = ['about', 'speakers', 'invited-speakers', 'committee', 'program', 'dates', 'papers', 'submission', 'registration'];
        const prevIndex = sectionOrder.indexOf(prevSection.id);
        if (prevIndex >= 0 && prevIndex < sectionOrder.length - 1) {
            sectionId = sectionOrder[prevIndex + 1];
        } else {
            console.error('Could not determine next section ID for TBA section');
            return;
        }
    }
    
    if (!sectionId) {
        console.error('Could not determine section ID for TBA section');
        return;
    }
    
    // Map section IDs to titles
    const sectionTitles = {
        'program': 'Program Schedule',
        'papers': 'Call For Papers',
        'submission': 'Paper Submission',
        'registration': 'Registration',
        'speakers': 'Keynote Speakers',
        'invited-speakers': 'Invited Speakers',
        'committee': 'Organizing Committee',
        'dates': 'Important Dates'
    };
    
    const title = sectionTitles[sectionId] || 'Information';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector(`.${sectionId}-content`);
            
            if (contentElement) {
                contentElement.innerHTML = createTbaHTML(sectionId, title);
            } else {
                console.error(`No content container found in existing ${sectionId} section`);
            }
            return;
        }
        
        // Create new section element
        section = document.createElement('section');
        section.id = sectionId;
        section.className = `${sectionId}-section`;
        section.innerHTML = `
            <div class="section-container">
                <div class="section-header">
                    <h2 class="section-title">${title}</h2>
                    <div class="section-divider"></div>
                </div>
                <div class="${sectionId}-content">
                    ${createTbaHTML(sectionId, title)}
                </div>
            </div>
        `;
        
        // Insert after previous section
        insertAfter(section, prevSection);
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
    }
}
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
 * Create TBA (To Be Announced) HTML
 */
function createTbaHTML(sectionId, title = 'Information') {
    // Map section IDs to appropriate icons
    const icons = {
        'speakers': 'user-tie',
        'invited-speakers': 'user-graduate', // Added icon for invited speakers
        'committee': 'users',
        'program': 'calendar-alt',
        'dates': 'calendar-day',
        'papers': 'file-alt',
        'submission': 'upload',
        'registration': 'user-plus'
    };
    
    const icon = icons[sectionId] || 'info-circle';
    
    return `
        <div class="tba-container">
            <div class="tba-box">
                <div class="tba-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
               <h3 class="tba-title">To Be Announced</h3>
                <p class="tba-text">${title} will be available soon.</p>
            </div>
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
 * Load Call For Papers Section from Supabase
 */
/**
 * Load Call For Papers Section from Supabase
 */
async function loadPapersSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'papers';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector('.papers-content');
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing papers section');
                return;
            }
        } else {
            // Create papers section element
            section = document.createElement('section');
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
            contentElement = section.querySelector('.papers-content');
        }
        
        try {
            // Fetch intro content
            const { data: introData, error: introError } = await supabase
                .from('call_for_papers_intro')
                .select('content')
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (introError) {
                console.error('Error fetching call for papers intro:', introError);
                throw introError;
            }
            
            // Fetch categories
            const { data: categories, error: categoriesError } = await supabase
                .from('paper_categories')
                .select('*')
                .order('order_number');
                
            if (categoriesError) {
                console.error('Error fetching paper categories:', categoriesError);
                throw categoriesError;
            }
            
            // Fetch all topics
            const { data: topics, error: topicsError } = await supabase
                .from('paper_topics')
                .select('*')
                .order('order_number');
                
            if (topicsError) {
                console.error('Error fetching paper topics:', topicsError);
                throw topicsError;
            }
            
            // If no data, show TBA
            if (!introData || introData.length === 0) {
                contentElement.innerHTML = createTbaHTML('papers', 'Call For Papers');
                return;
            }
            
            // Extract introduction, conference policy, and important dates from the intro content
            let introContent = introData[0].content || '';
            
            // Separate intro text, conference policy, and dates if they exist in the intro content
            let introText = '';
            let policyText = '';
            let datesText = '';
            
            if (introContent.includes('**Conference Policy:**') && introContent.includes('**Important Dates:**')) {
                const policyParts = introContent.split('**Conference Policy:**');
                introText = policyParts[0].trim();
                
                const datesParts = policyParts[1].split('**Important Dates:**');
                policyText = '**Conference Policy:**' + datesParts[0];
                datesText = '**Important Dates:**' + datesParts[1];
            } else if (introContent.includes('**Important Dates:**')) {
                const parts = introContent.split('**Important Dates:**');
                introText = parts[0].trim();
                datesText = '**Important Dates:**' + parts[1];
            } else {
                introText = introContent;
            }
            
            // Group topics by category
            const topicsByCategory = {};
            if (categories) {
                categories.forEach(category => {
                    topicsByCategory[category.id] = {
                        title: category.title,
                        topics: []
                    };
                });
            }
            
            if (topics) {
                topics.forEach(topic => {
                    if (topicsByCategory[topic.category_id]) {
                        topicsByCategory[topic.category_id].topics.push(topic);
                    }
                });
            }
            
            // Start building HTML - begin with intro text (without dates)
            let papersHtml = `
                <div class="papers-container">
                    <div class="papers-intro">
                        ${introText ? formatMarkdown(introText) : ''}
                    </div>
            `;
            
            // Add topics right after intro, before dates
            if (Object.keys(topicsByCategory).length > 0) {
                papersHtml += `<div class="paper-topics">`;
                
                Object.values(topicsByCategory).forEach(category => {
                    if (category.topics.length > 0) {
                        papersHtml += `
                            <div class="paper-category">
                                <h3 class="category-title">${category.title}</h3>
                                <ul class="topics-list">
                        `;
                        
                        category.topics.forEach(topic => {
                            papersHtml += `<li>${topic.topic_name}</li>`;
                        });
                        
                        papersHtml += `
                                </ul>
                            </div>
                        `;
                    }
                });
                
                papersHtml += `</div>`;
            }
            
            // Add conference policy after topics
            if (policyText) {
                papersHtml += `
                    <div class="papers-policy">
                        ${formatMarkdown(policyText)}
                    </div>
                `;
            }
            
            // Add dates section after conference policy
            if (datesText) {
                papersHtml += `
                    <div class="papers-dates">
                        ${formatMarkdown(datesText)}
                    </div>
                `;
            }
            
            papersHtml += `</div>`;
            
            // Update the content
            contentElement.innerHTML = papersHtml;
            
        } catch (error) {
            console.error('Error loading papers section data:', error);
            contentElement.innerHTML = createTbaHTML('papers', 'Call For Papers');
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector('.papers-content');
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

// Helper function to format markdown content
function formatMarkdown(content) {
    // Basic markdown formatting
    return content
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
        .replace(/\n/g, '<br>'); // Line breaks
}