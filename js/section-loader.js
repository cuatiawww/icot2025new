document.addEventListener('DOMContentLoaded', function() {
    console.log('Section loader initialized');
});

// Make loadAllSections
window.loadAllSections = loadAllSections;

async function loadAllSections() {
    console.log('Starting to load all sections');
    let supabase;
    
    try {
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
    const heroSection = document.getElementById('home');
    if (!heroSection) {
        console.error('Hero section not found');
        return;
    }

    const aboutSection = document.getElementById('about');

    let prevSection = aboutSection || heroSection;
    const sections = [
        { id: 'tourist-attractions', title: 'Tourist Attractions', load: loadTouristAttractionsSection },
        { id: 'speakers', title: 'Keynote Speakers', load: loadSpeakersSection },
        { id: 'invited-speakers', title: 'Invited Speakers', load: loadInvitedSpeakersSection },
        { id: 'committee', title: 'Organizing Committee', load: loadCommitteeSection },
        { id: 'program', title: 'Program Schedule', load: loadSimpleTbaSection },
        { id: 'dates', title: 'Important Dates', load: loadDatesSection },
        { id: 'papers', title: 'Call For Papers', load: loadPapersSection },
        { id: 'submission', title: 'Paper Submission', load: loadPaperSubmissionSection },
        { id: 'participant-info', title: 'Participant Information', load: loadParticipantInfoSection },
        { id: 'registration', title: 'Registration', load: loadSimpleTbaSection }
    ];
    
    for (const section of sections) {
        const existingSection = document.getElementById(section.id);
        if (existingSection) {
            console.log(`Section ${section.id} already exists, replacing content`);
            try {
                await section.load(supabase, existingSection, true);
                prevSection = existingSection;
            } catch (error) {
                console.error(`Error updating existing section ${section.id}:`, error);
                const contentContainer = existingSection.querySelector(`.${section.id}-content`);
                if (contentContainer) {
                    contentContainer.innerHTML = createTbaHTML(section.id, section.title);
                }
            }
            
            continue;
        }
        n
        try {
            console.log(`Loading new section: ${section.id}`);
            await section.load(supabase, prevSection);
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

async function loadInvitedSpeakersSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'invited-speakers';
    
    try {
        let section;
        let contentContainer;
        
        if (isExisting) {
            section = prevSection;
            contentContainer = section.querySelector('.invited-speakers-content');
            
            if (contentContainer) {
                contentContainer.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing invited speakers section');
                return;
            }
        } else {
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
 * Modified loadSpeakersSection function to create simplified speaker cards
 * that link to keynote-speech.html page
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
            
            // Create speakers list HTML - SIMPLIFIED VERSION WITH LINKS
            let speakersHtml = '<div class="speakers-list">';
            
            speakers.forEach((speaker, index) => {
                // Create a placeholder if no image is available
                const imageHtml = speaker.image_url 
                    ? `<img src="${speaker.image_url}" alt="${speaker.name}" class="speaker-image">`
                    : `<div class="speaker-placeholder" style="background-color: #ffab00; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                        <span style="color: white; font-size: 1.8rem; font-weight: bold;">${speaker.name.split(' ').pop()}</span>
                       </div>`;
                
                // Create simpler speaker card with link to keynote-speech.html
                speakersHtml += `
                    <a href="keynote-speech.html?type=keynote&id=${speaker.id}" class="speaker-card-link">
                        <div class="speaker-card" data-speaker-index="${index}">
                            <div class="speaker-content simplified">
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
                            </div>
                        </div>
                    </a>
                `;
            });
            
            speakersHtml += '</div>';
            
            // Update content
            contentContainer.innerHTML = speakersHtml;
            console.log('Speakers section rendered successfully');
            
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

/**
 * Similarly modify loadInvitedSpeakersSection function
 */
/**
 * Modified loadInvitedSpeakersSection function to match the keynote speakers UI
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
                .from('invited_speakers') 
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) {
                console.error('Error fetching invited speakers:', error);
                throw error;
            }
            
            if (!speakers || speakers.length === 0) {
                console.log('No invited speakers found, showing TBA state');
                contentContainer.innerHTML = createTbaHTML('invited-speakers', 'Invited Speakers');
                return;
            }
            
            console.log(`Found ${speakers.length} invited speakers, rendering them`);
            
            // Create speakers list HTML with consistent styling
            let speakersHtml = '<div class="speakers-list invited-list">';
            
            speakers.forEach((speaker, index) => {
                // Create a placeholder if no image is available
                const imageHtml = speaker.image_url 
                    ? `<img src="${speaker.image_url}" alt="${speaker.name}" class="speaker-image">`
                    : `<div class="speaker-placeholder" style="background-color: #ffab00; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%;">
                        <span style="color: white; font-size: 1.8rem; font-weight: bold;">${speaker.name.split(' ').pop()}</span>
                       </div>`;
                
                // Create simpler speaker card with link to keynote-speech.html
                speakersHtml += `
                    <a href="keynote-speech.html?type=invited&id=${speaker.id}" class="speaker-card-link">
                        <div class="speaker-card">
                            <div class="speaker-content simplified">
                                <div class="speaker-profile">
                                    <div class="speaker-image-container">
                                        ${imageHtml}
                                    </div>
                                    <div class="speaker-info">
                                        <h3 class="speaker-name">${speaker.name || 'TBA'}</h3>
                                        <p class="speaker-title invited">Invited Speaker</p>
                                        <p class="speaker-position">${speaker.position || ''}</p>
                                        <p class="speaker-affiliation">${speaker.affiliation || ''}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
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

async function fetchInvitedSpeakers(supabase) {
    try {
      // Query invited speakers table
      const { data, error } = await supabase
        .from('invited_speakers')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('Error fetching invited speakers:', error);
        throw error;
      }
      
      console.log('Invited speakers data:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch invited speakers:', error);
      throw error;
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
                date: "31 July 2025",
                type: "deadline"
            },
            {
                label: "Notification of Acceptance",
                date: "31 August 2025",
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
                date: "27-29 October 2025",
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
            // Create papers
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
            
            insertAfter(section, prevSection);
            contentElement = section.querySelector('.papers-content');
        }
        
        try {
            // Fetch
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

/**
 * Load Paper Submission Section data from Supabase
 */
async function loadPaperSubmissionSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'submission';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector('.submission-content');
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing submission section');
                return;
            }
        } else {
            // Create submission section element
            section = document.createElement('section');
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
            contentElement = section.querySelector('.submission-content');
        }
        
        try {
            // Fetch paper submission content from Supabase
            const { data: submissionData, error: submissionError } = await supabase
                .from('paper_submission')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);
                
            if (submissionError) {
                console.error('Error fetching paper submission data:', submissionError);
                throw submissionError;
            }
            
            // If no data, show TBA
            if (!submissionData || submissionData.length === 0) {
                contentElement.innerHTML = createTbaHTML('submission', 'Paper Submission');
                return;
            }
            
            const submissionContent = submissionData[0];
            
            // Build the HTML structure for paper submission
            let submissionHtml = `
                <div class="submission-container">
                    <div class="submission-intro">
                        ${formatMarkdown(submissionContent.introduction || '')}
                    </div>
            `;
            
            // Add general instructions section if exists
            if (submissionContent.general_instructions) {
                submissionHtml += `
                    <div class="submission-section">
                        <h3 class="subsection-title">General Information for Papers Submission</h3>
                        <div class="submission-instructions">
                            ${formatMarkdown(submissionContent.general_instructions)}
                        </div>
                    </div>
                `;
            }
            
            // Add submission portal info if exists - UPDATED with clickable link in orange
            if (submissionContent.submission_portal) {
                submissionHtml += `
                    <div class="submission-portal">
                        <h3 class="subsection-title">Submission Portal</h3>
                        <div class="portal-details">
                            <p>
                                <span class="link-label">Submission portal:</span> 
                                <a href="https://cmt3.research.microsoft.com/ICOT2025" class="orange-link" target="_blank">https://cmt3.research.microsoft.com/User/Login?ReturnUrl=%2F</a>
                            </p>
                            <p class="note">
                                <strong>NOTE:</strong> When uploading files, please compress the files into .zip or .rar and the file size is limited to 200MB.
                            </p>
                        </div>
                    </div>
                `;
            }
            
            // Add format guidelines section if exists
            if (submissionContent.format_guidelines) {
                // Replace any URLs with clickable links
                const formattedGuidelines = submissionContent.format_guidelines.replace(
                    /https?:\/\/[^\s)]+/g, 
                    url => `<a href="${url}" class="orange-link" target="_blank">${url}</a>`
                );
                
                submissionHtml += `
                    <div class="submission-format">
                        <h3 class="subsection-title">Manuscript Format Guidelines</h3>
                        <div class="format-details">
                            ${formatMarkdown(formattedGuidelines)}
                        </div>
                    </div>
                `;
            }
            
            // Add template links if exists - make IEEE URL clickable
            if (submissionContent.template_links) {
                const formattedTemplateLinks = submissionContent.template_links
                    .replace(
                        /(https:\/\/www\.ieee\.org\/conferences\/publishing\/templates\.html)/g,
                        '<a href="$1" class="orange-link" target="_blank">$1</a>'
                    )
                    .replace(
                        /IEEE Manuscript Templates for Conference Proceedings/g,
                        '<a href="https://www.ieee.org/conferences/publishing/templates.html" class="orange-link" target="_blank">IEEE Manuscript Templates for Conference Proceedings</a>'
                    );
                
                submissionHtml += `
                    <div class="template-section">
                        <h3 class="subsection-title">Templates</h3>
                        <div class="template-links">
                            ${formatMarkdown(formattedTemplateLinks)}
                        </div>
                    </div>
                `;
            }
            
            // Add camera-ready instructions if exists - make IEEE PDF eXpress URL clickable
            if (submissionContent.camera_ready_instructions) {
                const formattedInstructions = submissionContent.camera_ready_instructions
                    .replace(
                        /(https:\/\/ieee-pdf-express\.org)/g,
                        '<a href="$1" class="orange-link" target="_blank">$1</a>'
                    );
                
                submissionHtml += `
                    <div class="camera-ready-section">
                        <h3 class="subsection-title">Final Camera-Ready Manuscript Preparation</h3>
                        <div class="camera-ready-details">
                            ${formatMarkdown(formattedInstructions)}
                        </div>
                    </div>
                `;
            }
            
            // Add contact information if exists - make email clickable
            if (submissionContent.contact_info) {
                const formattedContactInfo = submissionContent.contact_info
                    .replace(
                        /(icot2025@ideas-lab\.org)/g,
                        '<a href="mailto:$1" class="orange-link">$1</a>'
                    )
                    .replace(
                        /Microsoft CMT Support/g,
                        '<a href="https://cmt3.research.microsoft.com/Support" class="orange-link" target="_blank">Microsoft CMT Support</a>'
                    );
                
                submissionHtml += `
                    <div class="contact-section">
                        <h3 class="subsection-title">Contact Information</h3>
                        <div class="contact-details">
                            ${formatMarkdown(formattedContactInfo)}
                        </div>
                    </div>
                `;
            }
            
            // Add Important Dates section with link to main dates page
            submissionHtml += `
                <div class="important-dates-section">
                    <h3 class="subsection-title">Important Dates</h3>
                    <div class="dates-summary">
                        <ul>
                            <li><strong>Full Paper Submission:</strong> 31 July 2025</li>
                            <li><strong>Notification of Acceptance:</strong> 31 August 2025</li>
                            <li><strong>Camera Ready Paper Submission:</strong> 15 September 2025</li>
                        </ul>
                        <p class="view-more-dates">
                            <a href="#dates" class="dates-link" data-section="dates">View all important dates <i class="fas fa-arrow-right"></i></a>
                        </p>
                    </div>
                </div>
            `;
            
            // Close the container
            submissionHtml += `</div>`;
            
            // Update the content
            contentElement.innerHTML = submissionHtml;
            
            // Add event listener to the "View all important dates" link
            const datesLink = contentElement.querySelector('.dates-link');
            if (datesLink) {
                datesLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    const sectionId = this.getAttribute('data-section');
                    const element = document.getElementById(sectionId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            }
            
            // Add CSS for links if needed
            const existingStyle = document.getElementById('submission-links-style');
            if (!existingStyle) {
                const style = document.createElement('style');
                style.id = 'submission-links-style';
                style.textContent = `
                    .orange-link {
                        color: #FF6F00;
                        font-weight: bold;
                        text-decoration: none;
                    }
                    
                    .orange-link:hover {
                        text-decoration: underline;
                    }
                    
                    .link-label {
                        font-weight: bold;
                    }
                    
                    .note {
                        margin-top: 10px;
                        color: #555;
                    }
                `;
                document.head.appendChild(style);
            }
            
        } catch (error) {
            console.error('Error loading paper submission section data:', error);
            contentElement.innerHTML = createTbaHTML('submission', 'Paper Submission');
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
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

// Enhanced formatMarkdown function to better handle links
function formatMarkdown(content) {
    if (!content) return '';
    
    // Basic markdown formatting
    return content
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Italic
        .replace(/\n/g, '<br>'); // Line breaks
}



/**
 * Function to create and load Participant Information Section
 * This function can be added to section-loader.js for ICOT 2025
 */
async function loadParticipantInfoSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'participant-info';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector(`.${sectionId}-content`);
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error(`No content container found in existing ${sectionId} section`);
                return;
            }
        } else {
            // Create new section element
            section = document.createElement('section');
            section.id = sectionId;
            section.className = `${sectionId}-section`;
            section.innerHTML = `
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title">Participant Information</h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="${sectionId}-content">
                        ${createLoadingHTML()}
                    </div>
                </div>
            `;
            
            // Insert after previous section
            insertAfter(section, prevSection);
            contentElement = section.querySelector(`.${sectionId}-content`);
        }
        
        // Define the structure for participant information
        const participantInfoHTML = `
            <div class="participant-info-container">
                <div class="info-cards">
                    <!-- Registration Card -->
                    <div class="info-card">
                        <div class="info-card-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="info-card-content">
                            <h3 class="info-card-title">Registration</h3>
                            <p class="info-card-text">Information about how to register for ICOT 2025, including fees, deadlines, and payment methods.</p>
                            <a href="registration.html" class="info-card-link">
                                <span>View Registration Details</span>
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Venue Card -->
                    <div class="info-card">
                        <div class="info-card-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="info-card-content">
                            <h3 class="info-card-title">Venue & Accommodation</h3>
                            <p class="info-card-text">Information about the conference venue, nearby accommodations, and getting around Bandung.</p>
                            <a href="venue.html" class="info-card-link">
                                <span>View Venue Details</span>
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Travel Information Card -->
                    <div class="info-card">
                        <div class="info-card-icon">
                            <i class="fas fa-plane"></i>
                        </div>
                        <div class="info-card-content">
                            <h3 class="info-card-title">Travel Information</h3>
                            <p class="info-card-text">Information about traveling to Bandung, including flights, trains, and local transportation.</p>
                            <a href="travel.html" class="info-card-link">
                                <span>View Travel Guide</span>
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Hotel Booking Card -->
                    <div class="info-card">
                        <div class="info-card-icon">
                            <i class="fas fa-hotel"></i>
                        </div>
                        <div class="info-card-content">
                            <h3 class="info-card-title">Hotel Booking</h3>
                            <p class="info-card-text">Information about hotel options, special rates for conference attendees, and how to book.</p>
                            <a href="hotel-booking.html" class="info-card-link">
                                <span>View Hotel Booking Details</span>
                                <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="important-notice">
                    <div class="notice-header">
                        <i class="fas fa-info-circle"></i>
                        <h3>Important Notice for Participants</h3>
                    </div>
                    <div class="notice-content">
                        <p>Early bird registration will end on <strong>September 30, 2025</strong>. Register early for discounted rates!</p>
                        <p>For visa support letters or any special accommodations, please contact us at <a href="mailto:icot2025@ideas-lab.org">icot2025@ideas-lab.org</a></p>
                    </div>
                </div>
            </div>
        `;
        
        // Update content
        contentElement.innerHTML = participantInfoHTML;
        
        // Add CSS for the participant information section
        addParticipantInfoCSS();
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector(`.${sectionId}-content`);
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

// Helper function to add CSS for participant information section
function addParticipantInfoCSS() {
    const styleId = 'participant-info-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .participant-info-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        
        .info-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
        }
        
        .info-card {
            display: flex;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .info-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
        }
        
        .info-card-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            background-color: #f8f8f8;
            color: #FF6F00;
            font-size: 2rem;
        }
        
        .info-card-content {
            padding: 1.5rem;
            flex: 1;
        }
        
        .info-card-title {
            font-size: 1.25rem;
            margin-bottom: 0.75rem;
            color: #333;
        }
        
        .info-card-text {
            color: #666;
            margin-bottom: 1rem;
            line-height: 1.5;
        }
        
        .info-card-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-decoration: none;
            color: #FF6F00;
            font-weight: 500;
            transition: color 0.3s ease;
        }
        
        .info-card-link:hover {
            color: #d66000;
        }
        
        .important-notice {
            background-color: #fff8e1;
            border-left: 4px solid #FF6F00;
            border-radius: 0 8px 8px 0;
            padding: 1.5rem;
        }
        
        .notice-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            color: #FF6F00;
        }
        
        .notice-header i {
            font-size: 1.5rem;
            margin-right: 0.75rem;
        }
        
        .notice-header h3 {
            font-size: 1.25rem;
            margin: 0;
        }
        
        .notice-content p {
            margin-bottom: 0.75rem;
            line-height: 1.5;
        }
        
        .notice-content a {
            color: #FF6F00;
            text-decoration: none;
            font-weight: 500;
        }
        
        .notice-content a:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 768px) {
            .info-card {
                flex-direction: column;
            }
            
            .info-card-icon {
                width: 100%;
                height: 80px;
            }
        }
    `;
    
    // Add style to document head
    document.head.appendChild(style);
}

// Update the sections list in the loadAllSections function
// Add this section to the sections array
// Example:
/*
const sections = [
    { id: 'speakers', title: 'Keynote Speakers', load: loadSpeakersSection },
    { id: 'invited-speakers', title: 'Invited Speakers', load: loadInvitedSpeakersSection },
    { id: 'committee', title: 'Organizing Committee', load: loadCommitteeSection },
    { id: 'program', title: 'Program Schedule', load: loadSimpleTbaSection },
    { id: 'dates', title: 'Important Dates', load: loadDatesSection },
    { id: 'papers', title: 'Call For Papers', load: loadPapersSection },
    { id: 'submission', title: 'Paper Submission', load: loadPaperSubmissionSection },
    { id: 'participant-info', title: 'Participant Information', load: loadParticipantInfoSection },
    { id: 'registration', title: 'Registration', load: loadSimpleTbaSection }
];
*/

/**
 * Load Tourist Attractions Section data from Supabase
 */
async function loadTouristAttractionsSection(supabase, prevSection, isExisting = false) {
    const sectionId = 'tourist-attractions';
    
    try {
        let section;
        let contentElement;
        
        if (isExisting) {
            // Use existing section
            section = prevSection;
            contentElement = section.querySelector('.tourist-attractions-content');
            
            if (contentElement) {
                contentElement.innerHTML = createLoadingHTML();
            } else {
                console.error('No content container found in existing tourist attractions section');
                return;
            }
        } else {
            // Create new section element
            section = document.createElement('section');
            section.id = sectionId;
            section.className = 'tourist-attractions-section';
            section.innerHTML = `
                <div class="section-container">
                    <div class="section-header">
                        <h2 class="section-title">Tourist Attractions</h2>
                        <div class="section-divider"></div>
                    </div>
                    <div class="tourist-attractions-content">
                        ${createLoadingHTML()}
                    </div>
                </div>
            `;
            
            // Insert after previous section
            insertAfter(section, prevSection);
            contentElement = section.querySelector('.tourist-attractions-content');
        }
        
        try {
            // Fetch attractions from Supabase
            const { data: attractions, error } = await supabase
                .from('tourist_attractions')
                .select('*')
                .order('created_at', { ascending: true });
                
            if (error) {
                console.error('Error fetching tourist attractions:', error);
                throw error;
            }
            
            if (!attractions || attractions.length === 0) {
                console.log('No tourist attractions found, loading from static data');
                // Fall back to static data if no attractions in database
                const staticAttractions = await loadStaticAttractions();
                renderAttractions(staticAttractions, contentElement);
                return;
            }
            
            console.log(`Found ${attractions.length} tourist attractions, rendering them`);
            renderAttractions(attractions, contentElement);
            
        } catch (error) {
            console.error('Error in Supabase query for tourist attractions:', error);
            // Fall back to static data
            const staticAttractions = await loadStaticAttractions();
            renderAttractions(staticAttractions, contentElement);
        }
        
    } catch (error) {
        console.error(`Error loading ${sectionId} section:`, error);
        window.showNotification(`Failed to load ${sectionId} section. Please try again later.`, 'error');
        
        // Set error state in the section
        const section = document.getElementById(sectionId);
        if (section) {
            const contentElement = section.querySelector('.tourist-attractions-content');
            if (contentElement) {
                contentElement.innerHTML = createErrorHTML();
            }
        }
    }
}

/**
 * Render attractions data to HTML
 */
function renderAttractions(attractions, contentElement) {
    // Filter attractions by category to group them
    const categories = [...new Set(attractions.map(attraction => {
        const mainCategory = attraction.category.split(',')[0].trim();
        return mainCategory;
    }))];
    
    let attractionsHtml = `
        <div class="attractions-container">
            <div class="attractions-intro">
                <p>Bandung, known as the "Paris of Java," offers a variety of attractions for conference attendees to explore. Here are some recommended places to visit during your stay for ICOT 2025:</p>
            </div>
            
            <div class="category-filter">
                <button class="filter-button active" data-category="all">All</button>
                ${categories.map(category => `
                    <button class="filter-button" data-category="${category.toLowerCase().replace(/\s+/g, '-')}">${category}</button>
                `).join('')}
            </div>
            
            <div class="attractions-grid">
    `;
    
    // Add each attraction
    attractions.forEach(attraction => {
        const mainCategory = attraction.category.split(',')[0].trim();
        const categoryClass = mainCategory.toLowerCase().replace(/\s+/g, '-');
        
        attractionsHtml += `
            <div class="attraction-card" data-category="${categoryClass}">
                <div class="attraction-image">
                    <img src="${attraction.image_url || 'https://placehold.co/600x400/f97316/white?text=Attraction'}" alt="${attraction.name}">
                </div>
                <div class="attraction-content">
                    <h3 class="attraction-name">${attraction.name}</h3>
                    <span class="attraction-category">${attraction.category}</span>
                    <p class="attraction-description">${attraction.description}</p>
                    <div class="attraction-details">
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${attraction.address}</span>
                        </div>
                        ${attraction.website ? `
                        <div class="detail-item">
                            <i class="fas fa-globe"></i>
                            <a href="${attraction.website}" target="_blank">Visit Website</a>
                        </div>
                        ` : ''}
                        <div class="detail-item">
                            <i class="fas fa-map"></i>
                            <a href="${attraction.google_maps}" target="_blank">View on Google Maps</a>
                        </div>
                        <div class="detail-item price-info">
                            <i class="fas fa-ticket-alt"></i>
                            <div class="price-details">
                                <span>Domestic: ${attraction.domestic_price}</span>
                                <span>International: ${attraction.international_price}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    attractionsHtml += `
            </div>
        </div>
    `;
    
    // Update content
    contentElement.innerHTML = attractionsHtml;
    
    // Add event listeners for filtering
    setTimeout(() => {
        const filterButtons = document.querySelectorAll('.filter-button');
        const attractionCards = document.querySelectorAll('.attraction-card');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const category = this.dataset.category;
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter cards
                attractionCards.forEach(card => {
                    if (category === 'all' || card.dataset.category === category) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }, 100);
    
    // Add CSS for tourist attractions
    addTouristAttractionCSS();
}

/**
 * Add CSS for tourist attractions section
 */
function addTouristAttractionCSS() {
    const styleId = 'tourist-attractions-styles';
    
    // Check if styles already exist
    if (document.getElementById(styleId)) {
        return;
    }
    
    // Create style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .tourist-attractions-section {
            background: linear-gradient(to bottom, #fff, #fff7ed, #fff);
            padding: 4rem 0;
        }
        
        .attractions-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            max-width: 1280px;
            margin: 0 auto;
        }
        
        .attractions-intro {
            margin-bottom: 1rem;
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .attractions-intro p {
            font-size: 1.1rem;
            line-height: 1.6;
            color: #555;
        }
        
        .category-filter {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
        }
        
        .filter-button {
            padding: 0.6rem 1.2rem;
            background-color: #f5f5f5;
            border: none;
            border-radius: 30px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s ease;
            color: #555;
        }
        
        .filter-button:hover {
            background-color: #f97316;
            color: white;
        }
        
        .filter-button.active {
            background-color: #f97316;
            color: white;
            font-weight: 500;
        }
        
        .attractions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2rem;
        }
        
        .attraction-card {
            display: flex;
            flex-direction: column;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .attraction-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
        }
        
        .attraction-image {
            height: 200px;
            overflow: hidden;
        }
        
        .attraction-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }
        
        .attraction-card:hover .attraction-image img {
            transform: scale(1.1);
        }
        
        .attraction-content {
            padding: 1.5rem;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
        }
        
        .attraction-name {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .attraction-category {
            display: inline-block;
            font-size: 0.8rem;
            background-color: #fff7ed;
            padding: 0.3rem 0.6rem;
            border-radius: 20px;
            margin-bottom: 1rem;
            color: #f97316;
            font-weight: 500;
        }
        
        .attraction-description {
            font-size: 0.95rem;
            line-height: 1.5;
            color: #555;
            margin-bottom: 1.2rem;
        }
        
        .attraction-details {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 0.7rem;
        }
        
        .detail-item {
            display: flex;
            align-items: flex-start;
            font-size: 0.9rem;
            color: #666;
        }
        
        .detail-item i {
            color: #f97316;
            margin-right: 0.5rem;
            margin-top: 0.2rem;
            min-width: 16px;
        }
        
        .detail-item a {
            color: #f97316;
            text-decoration: none;
            transition: color 0.2s ease;
        }
        
        .detail-item a:hover {
            color: #ea580c;
            text-decoration: underline;
        }
        
        .price-info {
            border-top: 1px dashed #eee;
            padding-top: 0.7rem;
            margin-top: 0.3rem;
        }
        
        .price-details {
            display: flex;
            flex-direction: column;
        }
        
        @media (max-width: 768px) {
            .attractions-grid {
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            }
            
            .attraction-image {
                height: 180px;
            }
        }
        
        @media (max-width: 480px) {
            .filter-button {
                padding: 0.5rem 1rem;
                font-size: 0.8rem;
            }
            
            .attraction-content {
                padding: 1.2rem;
            }
            
            .attraction-name {
                font-size: 1.1rem;
            }
            
            .attractions-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    // Add style to document head
    document.head.appendChild(style);
}