// Settings page JavaScript for TweetExport extension

class TweetExportSettings {
  constructor() {
    this.settings = {};
    this.defaultSettings = {
      includeMedia: true,
      includeReplies: true,
      includeRetweets: false,
      includeMetrics: true,
      exportFormat: 'json',
      filenamePattern: 'tweets_{username}_{date}',
      showExportButtons: true,
      enableBulkSelection: true,
      buttonPosition: 'top-right',
      maxTweets: 1000,
      apiDelay: 1000,
      enableDebugMode: false
    };
    this.currentUser = { name: 'Guest', username: 'guest', profile_image_url: 'icons/icon32.png' };
    this.init();
  }

  init() {
    this.loadSettings();
    this.bindEvents();
    this.checkAuthStatus();
    this.updateUI();
  }

  bindEvents() {
    // Save settings
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    
    // Reset settings
    document.getElementById('reset-settings').addEventListener('click', () => this.resetSettings());
    
    
    // Real-time validation
    document.getElementById('max-tweets').addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value < 1 || value > 10000) {
        e.target.setCustomValidity('Please enter a value between 1 and 10000');
      } else {
        e.target.setCustomValidity('');
      }
    });
    
    document.getElementById('api-delay').addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value < 100 || value > 5000) {
        e.target.setCustomValidity('Please enter a value between 100 and 5000');
      } else {
        e.target.setCustomValidity('');
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('tweetExportSettings');
      this.settings = { ...this.defaultSettings, ...result.tweetExportSettings };
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...this.defaultSettings };
    }
  }

  updateUI() {
    // Update form fields with current settings
    Object.keys(this.settings).forEach(key => {
      const element = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = this.settings[key];
        } else {
          element.value = this.settings[key];
        }
      }
    });
    
    // Update last saved time
    this.updateLastSaved();
  }

  async saveSettings() {
    try {
      // Collect settings from form
      const newSettings = {};
      Object.keys(this.defaultSettings).forEach(key => {
        const elementId = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        const element = document.getElementById(elementId);
        if (element) {
          if (element.type === 'checkbox') {
            newSettings[key] = element.checked;
          } else {
            newSettings[key] = element.value;
          }
        }
      });
      
      // Validate settings
      if (!this.validateSettings(newSettings)) {
        return;
      }
      
      // Save to storage
      this.settings = newSettings;
      await chrome.storage.local.set({ tweetExportSettings: this.settings });
      
      // Update last saved time
      const now = new Date();
      await chrome.storage.local.set({ 
        settingsLastSaved: now.toISOString(),
        tweetExportSettings: this.settings 
      });
      
      this.updateLastSaved();
      this.showNotification('Settings saved successfully!', 'success');
      
      // Notify background script of settings change
      await chrome.runtime.sendMessage({
        action: 'settingsUpdated',
        settings: this.settings
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showNotification('Failed to save settings. Please try again.', 'error');
    }
  }

  validateSettings(settings) {
    // Validate max tweets
    if (settings.maxTweets < 1 || settings.maxTweets > 10000) {
      alert('Maximum tweets must be between 1 and 10000');
      return false;
    }
    
    // Validate API delay
    if (settings.apiDelay < 100 || settings.apiDelay > 5000) {
      alert('API delay must be between 100 and 5000 milliseconds');
      return false;
    }
    
    // Validate filename pattern
    if (!settings.filenamePattern.includes('{date}')) {
      alert('Filename pattern must include {date} placeholder');
      return false;
    }
    
    return true;
  }

  async resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      this.settings = { ...this.defaultSettings };
      await chrome.storage.local.set({ tweetExportSettings: this.settings });
      this.updateUI();
      this.showNotification('Settings reset to defaults', 'success');
    }
  }

  async checkAuthStatus() { return; }

  async loadUserData() { return; }

  updateUserDisplay() {
    const userName = document.getElementById('user-name');
    const userHandle = document.getElementById('user-handle');
    const userAvatar = document.getElementById('user-avatar');
    
    userName.textContent = this.currentUser.name;
    userHandle.textContent = `@${this.currentUser.username}`;
    userAvatar.src = this.currentUser.profile_image_url;
  }

  async handleLogin() { return; }

  async fetchTwitterUserData() { return; }

  async handleLogout() { return; }

  updateLastSaved() {
    chrome.storage.local.get('settingsLastSaved', (result) => {
      const lastSavedElement = document.getElementById('last-saved');
      if (result.settingsLastSaved) {
        const date = new Date(result.settingsLastSaved);
        lastSavedElement.textContent = date.toLocaleString();
      } else {
        lastSavedElement.textContent = 'Never';
      }
    });
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#1da1f2' : '#e0245e'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #ffffff;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Initialize settings page
document.addEventListener('DOMContentLoaded', () => {
  new TweetExportSettings();
});