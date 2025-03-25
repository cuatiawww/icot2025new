// CommitteeSection.js
// This component fetches and displays the committee section content from Supabase

// Function to create committee section HTML with loading state
function createCommitteeSectionLoading() {
    return `
      <section id="committee" class="committee-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Organizing Committee</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="committee-content">
            <div class="loading-container">
              <div class="loading-spinner"></div>
              <p class="loading-text">Loading committee data...</p>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to create committee section HTML with TBA state
  function createCommitteeSectionTBA() {
    return `
      <section id="committee" class="committee-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Organizing Committee</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="committee-content">
            <div class="tba-container">
              <div class="tba-box">
                <h3 class="tba-title">To Be Announced</h3>
                <p class="tba-text">Our organizing committee will be announced soon.</p>
                <div class="tba-icon">
                  <i class="far fa-calendar"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }
  
  // Function to create committee section HTML with data
  function createCommitteeSectionWithData(categories) {
    let html = `
      <section id="committee" class="committee-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Organizing Committee</h2>
            <div class="section-divider"></div>
          </div>
          
          <div class="committee-content">
            <div class="committee-categories">
    `;
    
    // Add each category
    categories.forEach(category => {
      html += `
        <div class="committee-category">
          <div class="category-header">
            <h3 class="category-title">${category.title}</h3>
          </div>
          
          <div class="category-content">
            <div class="members-grid">
      `;
      
      // Add each member
      category.members.forEach(member => {
        html += `
          <div class="committee-member">
            <h4 class="member-name">${member.name}</h4>
            <p class="member-affiliation">${member.affiliation || ''}</p>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    });
    
    html += `
            </div>
          </div>
        </div>
      </section>
    `;
    
    return html;
  }
  
  // Function to initialize and fetch committee data from Supabase
  async function initCommitteeSection(supabase) {
    try {
      // Fetch committee categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('committee_categories')
        .select('*')
        .order('order_number');
  
      if (categoriesError) throw categoriesError;
      
      // If no categories, show TBA section
      if (!categoriesData || categoriesData.length === 0) {
        return createCommitteeSectionTBA();
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
  
      // Create HTML with the data
      return createCommitteeSectionWithData(categoriesWithMembers);
      
    } catch (error) {
      console.error('Error fetching committee data:', error);
      return createCommitteeSectionTBA();
    }
  }
  
  // Export functions for use in the main application
  export { 
    createCommitteeSectionLoading, 
    createCommitteeSectionTBA,
    createCommitteeSectionWithData,
    initCommitteeSection
  };