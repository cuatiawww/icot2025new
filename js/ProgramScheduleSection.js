// ProgramScheduleSection.js
// This component fetches and displays the program schedule content from Supabase

// Function to create program schedule section HTML with loading state
function createProgramSectionLoading() {
    return `
      <section id="program" class="program-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Program Schedule</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="program-content">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <p class="loading-text">Loading program schedule...</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to create program schedule section HTML with TBA state
  function createProgramSectionTBA() {
    return `
      <section id="program" class="program-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Program Schedule</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="program-content">
            <div class="tba-container">
              <h3 class="tba-title">Program Schedule</h3>
              <p class="tba-text">Program schedule will be announced closer to the conference date.</p>
              <div class="tba-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M0 0h24v24H0z" fill="none"/>
                  <path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to create program schedule section HTML with PDF viewer
  function createProgramSectionWithPDF(schedule) {
    return `
      <section id="program" class="program-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Program Schedule</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="program-content">
            <div class="program-schedule-container">
              <div class="program-header">
                <h3 class="program-title">${schedule.title}</h3>
                <a
                  href="${schedule.pdf_url}"
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
                  src="${schedule.pdf_url}#toolbar=0"
                  class="pdf-viewer"
                  title="Program Schedule PDF"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to initialize and fetch program schedule data from Supabase
  async function initProgramSection(supabase) {
    try {
      // Fetch program schedule
      const { data, error } = await supabase
        .from('program_schedules')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
  
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is the error code for no rows returned
      
      // If no schedule, show TBA section
      if (!data) {
        return createProgramSectionTBA();
      }
  
      // Create HTML with the PDF viewer
      return createProgramSectionWithPDF(data);
      
    } catch (error) {
      console.error('Error fetching program schedule:', error);
      return createProgramSectionTBA();
    }
  }
  
  // Export functions for use in the main application
  export { 
    createProgramSectionLoading, 
    createProgramSectionTBA,
    createProgramSectionWithPDF,
    initProgramSection
  };