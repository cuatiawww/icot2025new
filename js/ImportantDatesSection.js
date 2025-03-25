// ImportantDatesSection.js
// This component displays the important dates for the conference

// Function to create HTML for important dates section
function createImportantDatesSection() {
    // Static dates data - in a real app, this would come from the database
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
  
    // Create HTML for the dates section
    let datesHTML = `
      <section id="dates" class="dates-section">
        <div class="section-container">
          <div class="section-header">
            <h2 class="section-title">Important Dates</h2>
            <div class="section-divider"></div>
          </div>
  
          <div class="dates-container">
            <div class="timeline-container">
              <!-- Timeline line -->
              <div class="timeline-line"></div>
  
              <div class="timeline-items">
    `;
  
    // Add each date to the HTML
    dates.forEach((item, index) => {
      datesHTML += `
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
  
    // Close the HTML structure
    datesHTML += `
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  
    return datesHTML;
  }
  
  // In a vanilla JS implementation, we would add this to the DOM
  // document.getElementById('main-content').innerHTML += createImportantDatesSection();