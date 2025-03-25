// AboutSection.js
// This component fetches and displays the about section content from Supabase

// Function to fetch about content from Supabase
async function fetchAboutContent(supabase) {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .single();
  
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching about content:', error);
      return null;
    }
  }
  
  // Function to create loading state HTML
  function createLoadingState() {
    return `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading content...</p>
      </div>
    `;
  }
  
  // Function to create about section HTML with content
  function createAboutContentHTML(content) {
    if (!content) {
      return `
        <div class="about-text">
          <p>Information about ICOT 2025 will be coming soon.</p>
        </div>
      `;
    }
  
    // Split content into paragraphs
    const paragraphs = content.content.split('\n\n');
    
    let paragraphsHtml = '';
    paragraphs.forEach((paragraph, index) => {
      paragraphsHtml += `
        <p class="${index === 0 ? 'first-paragraph' : ''}">${paragraph}</p>
      `;
    });
    
    return `
      <div class="about-text">
        ${paragraphsHtml}
      </div>
    `;
  }
  
  // Function to create about section HTML structure
  function createAboutSection(title = 'About ICOT 2025') {
    return `
      <section id="about" class="about-section">
        <div class="section-container">
          <div class="section-header">
            <div class="section-icon-container">
              <div class="section-icon"></div>
            </div>
            <h2 class="section-title">${title}</h2>
            <div class="section-divider"></div>
          </div>
  
          <div class="about-content">
            ${createLoadingState()}
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to initialize about section
  async function initAboutSection(supabase) {
    // First render the section with loading state
    document.getElementById('main-content').innerHTML += createAboutSection();
    
    // Then fetch the content
    const content = await fetchAboutContent(supabase);
    
    // Update the section with content
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
      // Update title if content exists
      if (content) {
        const titleElement = aboutSection.querySelector('.section-title');
        if (titleElement) {
          titleElement.textContent = content.title;
        }
      }
      
      // Update content
      const aboutContent = aboutSection.querySelector('.about-content');
      if (aboutContent) {
        aboutContent.innerHTML = createAboutContentHTML(content);
      }
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
    await initAboutSection(supabase);
  });
  */