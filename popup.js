// Popup JavaScript for TweetExport extension

class TweetExportPopup {
  constructor() {
    this.currentUser = null;
    this.isExporting = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.currentUser = { name: 'Guest', username: 'guest', profile_image_url: 'icons/icon32.png' };
    this.setupDateDefaults();
    this.updateUserDisplay();
    this.showUserSection();
  }

  bindEvents() {
    // Export events
    document.getElementById('export-btn').addEventListener('click', () => this.handleExport());
    document.getElementById('cancel-export').addEventListener('click', () => this.handleCancelExport());
    document.getElementById('new-export').addEventListener('click', () => this.resetToExportOptions());
    
    // Footer links
    document.getElementById('settings-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openSettings();
    });
    
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      this.openHelp();
    });
  }

  setupDateDefaults() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    document.getElementById('date-from').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('date-to').value = today.toISOString().split('T')[0];
  }

  async checkAuthStatus() { return; }

  async loadUserData() { return; }

  updateUserDisplay() {
    if (this.currentUser) {
      document.getElementById('user-avatar').src = this.currentUser.profile_image_url || 'icons/icon32.png';
      document.getElementById('user-name').textContent = this.currentUser.name;
      document.getElementById('user-handle').textContent = `@${this.currentUser.username}`;
    }
  }

  async handleLogin() { return; }

  async fetchTwitterUserData() { return; }

  async handleLogout() { return; }

  async handleExport() {
    if (this.isExporting) return;
    
    this.isExporting = true;
    const exportBtn = document.getElementById('export-btn');
    exportBtn.innerHTML = '<span class="loading"></span> Preparing...';
    exportBtn.disabled = true;
    
    try {
      // Get export options
      const options = {
        includeMedia: document.getElementById('export-media').checked,
        includeReplies: document.getElementById('export-replies').checked,
        includeRetweets: document.getElementById('export-retweets').checked,
        dateFrom: document.getElementById('date-from').value,
        dateTo: document.getElementById('date-to').value
      };
      
      // Show progress section
      this.showProgressSection();
      
      // Fetch tweets from current page
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      try {
        const { tweetExportSettings } = await chrome.storage.local.get('tweetExportSettings');
        const maxTweets = tweetExportSettings?.maxTweets || 300;
        const username = this.parseProfileUsername(tab.url);
        if (username) {
          options.profileUsername = username;
          options.autoScroll = true;
          options.maxTweets = maxTweets;
        }
      } catch {}
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'fetchTweets',
        options: options
      });
      
      if (response && response.tweets) {
        await this.exportTweets(response.tweets);
      } else {
        throw new Error('No tweets found on current page');
      }
      
    } catch (error) {
      console.error('Export error:', error);
      this.showError('Export failed. Please try again.');
      this.showExportOptions();
    } finally {
      this.isExporting = false;
      exportBtn.innerHTML = '<span class="btn-text">Export Tweets</span><span class="btn-icon">📤</span>';
      exportBtn.disabled = false;
    }
  }

  parseProfileUsername(url) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const first = parts[0] || '';
      const reserved = new Set(['home','explore','notifications','messages','i','settings','compose','search','help','tos','privacy','hashtag','topic','lists']);
      if (!first || reserved.has(first)) return null;
      if (first === 'status') return null;
      return first;
    } catch {
      return null;
    }
  }

  async exportTweets(tweets) {
    try {
      // Update progress
      this.updateProgress(50, 'Exporting tweets...');
      
      // Send tweets to background script for export
      const response = await chrome.runtime.sendMessage({
        action: 'exportTweets',
        tweets: tweets
      });
      
      if (response.success) {
        this.updateProgress(100, 'Export complete!');
        this.showResults(response.result);
      } else {
        throw new Error(response.error);
      }
      
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }

  updateProgress(percent, text) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    progressFill.style.width = `${percent}%`;
    progressText.textContent = text;
  }

  handleCancelExport() {
    this.isExporting = false;
    this.showExportOptions();
  }

  resetToExportOptions() {
    this.showExportOptions();
  }

  // UI State Management
  showLoginSection() { return; }

  showUserSection() {
    this.hideAllSections();
    document.getElementById('user-section').classList.remove('hidden');
    document.getElementById('export-section').classList.remove('hidden');
  }

  showExportOptions() {
    this.hideAllSections();
    document.getElementById('user-section').classList.remove('hidden');
    document.getElementById('export-section').classList.remove('hidden');
  }

  showProgressSection() {
    this.hideAllSections();
    document.getElementById('progress-section').classList.remove('hidden');
  }

  showResults(result) {
    this.hideAllSections();
    document.getElementById('results-section').classList.remove('hidden');
    
    // Update results display
    document.getElementById('export-summary').textContent = 
      `Successfully exported ${result.tweetCount} tweets`;
    document.getElementById('filename').textContent = result.filename;
  }

  hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.add('hidden'));
  }

  showError(message) {
    // Simple error display - could be enhanced with proper error UI
    console.error(message);
    alert(message);
  }

  openSettings() {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  }

  openHelp() {
    chrome.tabs.create({ url: 'https://github.com/your-repo/tweetexport#readme' });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TweetExportPopup();
});