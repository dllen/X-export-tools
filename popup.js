// Popup JavaScript for TweetExport extension

class TweetExportPopup {
  constructor() {
    this.currentUser = null;
    this.isExporting = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkAuthStatus();
    this.setupDateDefaults();
  }

  bindEvents() {
    // Login/logout events
    document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
    document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());
    
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

  async checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getAuthToken' });
      if (response.token) {
        await this.loadUserData();
        this.showUserSection();
      } else {
        this.showLoginSection();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.showLoginSection();
    }
  }

  async loadUserData() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getUserData' });
      if (response.userData) {
        this.currentUser = response.userData;
        this.updateUserDisplay();
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  updateUserDisplay() {
    if (this.currentUser) {
      document.getElementById('user-avatar').src = this.currentUser.profile_image_url || 'icons/icon32.png';
      document.getElementById('user-name').textContent = this.currentUser.name;
      document.getElementById('user-handle').textContent = `@${this.currentUser.username}`;
    }
  }

  async handleLogin() {
    const loginBtn = document.getElementById('login-btn');
    loginBtn.innerHTML = '<span class="loading"></span> Connecting...';
    loginBtn.disabled = true;

    try {
      // Request Twitter authentication
      const authUrl = 'https://twitter.com/oauth/authorize';
      
      // Open authentication window
      const result = await chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      });

      if (result) {
        // Extract token from redirect URL
        const url = new URL(result);
        const token = url.searchParams.get('oauth_token');
        
        if (token) {
          // Store auth token
          await chrome.runtime.sendMessage({ 
            action: 'setAuthToken', 
            token: token 
          });
          
          // Fetch user data
          await this.fetchTwitterUserData(token);
          this.showUserSection();
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed. Please try again.');
    } finally {
      loginBtn.innerHTML = '<img src="icons/twitter-icon.svg" alt="Twitter" class="btn-icon"> Login with Twitter';
      loginBtn.disabled = false;
    }
  }

  async fetchTwitterUserData(token) {
    try {
      // Fetch user data from Twitter API
      const response = await fetch('https://api.twitter.com/2/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        this.currentUser = userData.data;
        
        // Store user data
        await chrome.runtime.sendMessage({ 
          action: 'setUserData', 
          userData: this.currentUser 
        });
        
        this.updateUserDisplay();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  async handleLogout() {
    try {
      await chrome.runtime.sendMessage({ action: 'setAuthToken', token: null });
      await chrome.runtime.sendMessage({ action: 'setUserData', userData: null });
      this.currentUser = null;
      this.showLoginSection();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

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
  showLoginSection() {
    this.hideAllSections();
    document.getElementById('login-section').classList.remove('hidden');
  }

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