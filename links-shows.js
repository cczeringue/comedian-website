// Shows loader for links page
// Hardcoded shows for easy management

// 🎯 ADD YOUR SHOWS HERE:
const HARDCODED_SHOWS = [
  {
    id: 'bits-beats-feb-2026',
    name: 'Bits & Beats: Comedy and Disco!',
    date: '2026-02-12T19:00:00-08:00', // 7:00 PM PT
    venue: '995 Market St, 6th Fl',
    city: 'San Francisco',
    ticketUrl: 'https://partiful.com/e/MMU9dzYqlZ5KedusCOqm',
    platform: 'partiful'
  }
  // Add more shows here in the same format
];

// Format date for show cards (e.g., "15 MAR")
function formatShowDate(dateString) {
  if (!dateString) return { day: 'TBA', month: '' };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { day: 'TBA', month: '' };
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { day, month };
}

// Format time from datetime string
function formatShowTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Create show card HTML for links page (simplified style)
function createShowCardForLinks(show) {
  const { day, month } = formatShowDate(show.date);
  const time = formatShowTime(show.date);
  const ticketUrl = show.ticketUrl || show.url || '#';

  const card = document.createElement('a');
  card.href = ticketUrl;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.className = 'link-button show-link-button';

  card.innerHTML = `
    <div class="show-date-badge">
      <span class="date-day">${day}</span>
      <span class="date-month">${month}</span>
    </div>
    <div class="show-link-info">
      <span class="show-name">${show.name || show.venue || 'Show'}</span>
      <span class="show-venue">${show.venue || ''} ${show.city ? '• ' + show.city : ''}</span>
      ${time ? `<span class="show-time">${time}</span>` : ''}
    </div>
  `;

  return card;
}

// Main loader function
async function loadShows() {
  const showsGrid = document.getElementById('showsGrid');
  if (!showsGrid) return;

  // Show loading state
  showsGrid.innerHTML = '<div class="loading-shows" style="color: white; opacity: 0.7; padding: 1rem;">Loading shows...</div>';

  try {
    let shows = [];

    // Use only hardcoded shows (no Bandsintown or API)
    if (HARDCODED_SHOWS && HARDCODED_SHOWS.length > 0) {
      const now = new Date();
      shows = HARDCODED_SHOWS.filter(show => new Date(show.date) >= now);
    }

    // Render shows
    renderShows(shows, showsGrid);

  } catch (error) {
    console.error('Error loading shows:', error);
    showsGrid.innerHTML = `
      <div class="no-shows">
        <p>Unable to load shows right now.</p>
        <p class="small-text">Check back soon!</p>
      </div>
    `;
  }
}

// Render shows to the grid
function renderShows(shows, container) {
  if (!shows || shows.length === 0) {
    container.innerHTML = `
      <div class="no-shows">
        <p>No upcoming shows scheduled yet!</p>
        <p class="small-text">Check back soon for new dates.</p>
      </div>
    `;
    return;
  }

  // Clear container
  container.innerHTML = '';

  // Create and append show cards
  shows.forEach((show, index) => {
    const card = createShowCardForLinks(show);
    // Add staggered animation
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    container.appendChild(card);

    // Animate in with delay
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadShows);
} else {
  loadShows();
}
