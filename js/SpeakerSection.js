// SpeakerSection.js
// This component fetches and displays the speakers section content from Supabase

// Function to fetch speakers from Supabase
async function fetchSpeakers(supabase) {
    try {
      const { data, error } = await supabase
        .from('speakers')
        .select('*')
        .order('created_at', { ascending: true });
  
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching speakers:', error);
      return [];
    }
  }
  
  // Function to create loading state HTML
  function createLoadingState() {
    return `
      <div id="loadingState" class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading speakers...</p>
      </div>
    `;
  }
  
  // Function to create TBA (To Be Announced) state HTML
  function createTBAState() {
    return `
      <div id="tbaState" class="tba-container" style="display: none;">
        <div class="tba-box">
          <h3 class="tba-title">To Be Announced</h3>
          <p class="tba-text">Our keynote speakers will be announced soon.</p>
          <div class="tba-icon">
            <i class="far fa-calendar"></i>
          </div>
        </div>
      </div>
    `;
  }
  
  // Function to create speaker card HTML
  function createSpeakerCard(speaker) {
    return `
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
  }
  
  // Function to create the full speakers list HTML
  function createSpeakersList(speakers) {
    let speakersHtml = '';
    
    speakers.forEach(speaker => {
      speakersHtml += createSpeakerCard(speaker);
    });
    
    return `
      <div id="speakersList" class="speakers-list" style="display: none;">
        ${speakersHtml}
      </div>
    `;
  }
  
  // Function to create the complete speakers section HTML
  function createSpeakersSection() {
    return `
      <section id="speakers" class="speakers-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Keynote Speakers</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="speakers-content" id="speakersContent">
            ${createLoadingState()}
            ${createTBAState()}
            <div id="speakersList" class="speakers-list" style="display: none;"></div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to initialize speakers section
  async function initSpeakersSection(supabase) {
    // First render the section with loading state
    document.getElementById('main-content').innerHTML += createSpeakersSection();
    
    // Get references to key elements
    const loadingState = document.getElementById('loadingState');
    const tbaState = document.getElementById('tbaState');
    const speakersList = document.getElementById('speakersList');
    
    if (!loadingState || !tbaState || !speakersList) return;
    
    try {
      // Fetch speakers data
      const speakers = await fetchSpeakers(supabase);
      
      // Hide loading state
      loadingState.style.display = 'none';
      
      if (!speakers || speakers.length === 0) {
        // Show TBA state if no speakers
        tbaState.style.display = 'block';
      } else {
        // Show speakers list and populate it
        speakersList.style.display = 'block';
        
        // Clear existing content
        speakersList.innerHTML = '';
        
        // Add each speaker
        speakers.forEach(speaker => {
          const speakerCard = document.createElement('div');
          speakerCard.className = 'speaker-card';
          speakerCard.innerHTML = createSpeakerCard(speaker).trim();
          speakersList.appendChild(speakerCard);
        });
      }
    } catch (error) {
      console.error('Error initializing speakers section:', error);
      
      // Hide loading state and show TBA state on error
      if (loadingState) loadingState.style.display = 'none';
      if (tbaState) tbaState.style.display = 'block';
    }
  }
  
  // This would be used in a vanilla JS implementation
  // Example usage:
  /*
  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
  
  const supabase = createClient(
    'https://wunktcfckyvkiwpisoxp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1bmt0Y2Zja3l2a2l3cGlzb3hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzAzMTQsImV4cCI6MjA1NDYwNjMxNH0.aPB3Vduz9ugxkT0aoBAG4kv2hD4ZX6iA7yNBTjYr07s'
  );
  
  document.addEventListener('DOMContentLoaded', async function() {
    await initSpeakersSection(supabase);
  });
  */