// Injected script for additional Twitter(X) functionality
(function() {
  'use strict';
  
  // Add TweetExport utilities to the page
  window.TweetExport = {
    version: '1.0.0',
    
    // Utility functions for tweet extraction
    utils: {
      // Extract all visible tweets on the page
      extractVisibleTweets: function() {
        const tweets = [];
        const tweetElements = document.querySelectorAll('[data-testid="tweet"], article');
        
        tweetElements.forEach(element => {
          const tweetData = this.extractTweetData(element);
          if (tweetData) {
            tweets.push(tweetData);
          }
        });
        
        return tweets;
      },
      
      // Extract tweet data from DOM element
      extractTweetData: function(element) {
        try {
          const tweetId = this.extractTweetId(element);
          if (!tweetId) return null;
          
          return {
            id: tweetId,
            text: this.extractTweetText(element),
            author: this.extractAuthor(element),
            timestamp: this.extractTimestamp(element),
            metrics: this.extractMetrics(element),
            media: this.extractMedia(element),
            url: this.extractTweetUrl(element, tweetId)
          };
        } catch (error) {
          console.error('Error extracting tweet data:', error);
          return null;
        }
      },
      
      // Extract tweet ID from element
      extractTweetId: function(element) {
        // Try to find tweet ID in href
        const links = element.querySelectorAll('a[href*="/status/"]');
        for (const link of links) {
          const match = link.href.match(/\/status\/(\d+)/);
          if (match) return match[1];
        }
        
        // Try data attributes
        return element.getAttribute('data-tweet-id') || 
               element.closest('[data-tweet-id]')?.getAttribute('data-tweet-id') ||
               this.generateTweetId(element);
      },
      
      // Extract tweet text content
      extractTweetText: function(element) {
        const textElement = element.querySelector('[data-testid="tweetText"], div[lang]');
        return textElement ? textElement.textContent.trim() : element.textContent.trim();
      },
      
      // Extract author information
      extractAuthor: function(element) {
        const authorElement = element.querySelector('[data-testid="User-Name"]');
        if (!authorElement) return { name: '', username: '' };
        
        const name = authorElement.querySelector('span')?.textContent || '';
        const usernameElement = authorElement.querySelector('a[href^="/"]');
        const username = usernameElement ? usernameElement.textContent.trim() : '';
        
        return {
          name: name.trim(),
          username: username.startsWith('@') ? username : `@${username}`
        };
      },
      
      // Extract timestamp
      extractTimestamp: function(element) {
        const timeElement = element.querySelector('time');
        if (timeElement) {
          return timeElement.getAttribute('datetime') || timeElement.textContent;
        }
        return new Date().toISOString();
      },
      
      // Extract engagement metrics
      extractMetrics: function(element) {
        return {
          replies: this.extractMetric(element, 'reply'),
          retweets: this.extractMetric(element, 'retweet'),
          likes: this.extractMetric(element, 'like'),
          views: this.extractMetric(element, 'view')
        };
      },
      
      // Extract specific metric
      extractMetric: function(element, type) {
        const metricElement = element.querySelector(`[data-testid="${type}"], [aria-label*="${type}"]`);
        if (!metricElement) return 0;
        
        const text = metricElement.textContent || metricElement.getAttribute('aria-label') || '';
        const match = text.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, '')) : 0;
      },
      
      // Extract media content
      extractMedia: function(element) {
        const media = { images: [], videos: [] };
        
        // Images
        const images = element.querySelectorAll('img[src*="pbs.twimg.com"]');
        images.forEach(img => {
          if (img.src.includes('media') && !img.src.includes('profile')) {
            media.images.push({
              url: img.src,
              alt: img.alt || ''
            });
          }
        });
        
        // Videos
        const videos = element.querySelectorAll('video');
        videos.forEach(video => {
          media.videos.push({
            url: video.src || video.querySelector('source')?.src,
            poster: video.poster
          });
        });
        
        return media;
      },
      
      // Extract tweet URL
      extractTweetUrl: function(element, tweetId) {
        const author = this.extractAuthor(element);
        if (author.username && tweetId) {
          return `https://twitter.com/${author.username.replace('@', '')}/status/${tweetId}`;
        }
        return '';
      },
      
      // Generate unique ID for tweets
      generateTweetId: function(element) {
        const text = element.textContent || '';
        const timestamp = Date.now().toString();
        return Math.abs(text.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0)).toString() + timestamp.slice(-6);
      }
    },
    
    // Bulk export functionality
    bulkExport: {
      selectedTweets: new Set(),
      isSelecting: false,
      
      // Start bulk selection mode
      startSelection: function() {
        this.isSelecting = true;
        this.addSelectionUI();
        this.bindSelectionEvents();
      },
      
      // Stop bulk selection mode
      stopSelection: function() {
        this.isSelecting = false;
        this.removeSelectionUI();
        this.unbindSelectionEvents();
        this.selectedTweets.clear();
      },
      
      // Add selection UI
      addSelectionUI: function() {
        document.body.classList.add('tweetexport-bulk-mode');
        this.createSelectionToolbar();
      },
      
      // Remove selection UI
      removeSelectionUI: function() {
        document.body.classList.remove('tweetexport-bulk-mode');
        const toolbar = document.getElementById('tweetexport-selection-toolbar');
        if (toolbar) toolbar.remove();
      },
      
      // Create selection toolbar
      createSelectionToolbar: function() {
        const toolbar = document.createElement('div');
        toolbar.id = 'tweetexport-selection-toolbar';
        toolbar.className = 'tweetexport-toolbar';
        toolbar.innerHTML = `
          <span>Selected: <span class="count">0</span></span>
          <button onclick="window.TweetExport.bulkExport.exportSelected()">Export Selected</button>
          <button onclick="window.TweetExport.bulkExport.selectAll()">Select All</button>
          <button onclick="window.TweetExport.bulkExport.stopSelection()">Cancel</button>
        `;
        document.body.appendChild(toolbar);
      },
      
      // Bind selection events
      bindSelectionEvents: function() {
        document.addEventListener('click', this.handleSelectionClick);
      },
      
      // Unbind selection events
      unbindSelectionEvents: function() {
        document.removeEventListener('click', this.handleSelectionClick);
      },
      
      // Handle selection click
      handleSelectionClick: function(e) {
        if (!window.TweetExport.bulkExport.isSelecting) return;
        
        const tweetElement = e.target.closest('[data-testid="tweet"], article');
        if (!tweetElement) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const tweetId = window.TweetExport.utils.extractTweetId(tweetElement);
        if (tweetId) {
          window.TweetExport.bulkExport.toggleTweetSelection(tweetId, tweetElement);
        }
      },
      
      // Toggle tweet selection
      toggleTweetSelection: function(tweetId, element) {
        if (this.selectedTweets.has(tweetId)) {
          this.selectedTweets.delete(tweetId);
          element.classList.remove('tweetexport-selected');
        } else {
          this.selectedTweets.add(tweetId);
          element.classList.add('tweetexport-selected');
        }
        this.updateSelectionCount();
      },
      
      // Update selection count
      updateSelectionCount: function() {
        const countElement = document.querySelector('#tweetexport-selection-toolbar .count');
        if (countElement) {
          countElement.textContent = this.selectedTweets.size;
        }
      },
      
      // Select all visible tweets
      selectAll: function() {
        const tweets = window.TweetExport.utils.extractVisibleTweets();
        tweets.forEach(tweet => {
          this.selectedTweets.add(tweet.id);
          const element = document.querySelector(`[data-tweet-id="${tweet.id}"]`);
          if (element) {
            element.classList.add('tweetexport-selected');
          }
        });
        this.updateSelectionCount();
      },
      
      // Export selected tweets
      exportSelected: function() {
        if (this.selectedTweets.size === 0) {
          alert('No tweets selected');
          return;
        }
        
        const tweets = [];
        this.selectedTweets.forEach(tweetId => {
          const tweetData = window.TweetExport.utils.extractTweetData(
            document.querySelector(`[data-tweet-id="${tweetId}"]`)
          );
          if (tweetData) {
            tweets.push(tweetData);
          }
        });
        
        if (tweets.length > 0) {
          window.TweetExport.exportTweets(tweets);
        }
      }
    },
    
    // Export functionality
    exportTweets: function(tweets) {
      const exportData = {
        exportDate: new Date().toISOString(),
        tweetCount: tweets.length,
        tweets: tweets
      };
      
      const json = JSON.stringify(exportData, null, 2);
      const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tweets_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      this.showNotification(`Exported ${tweets.length} tweets successfully!`);
    },
    
    // Show notification
    showNotification: function(message, type = 'success') {
      const notification = document.createElement('div');
      notification.className = `tweetexport-notification ${type}`;
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
  };
  
  // Add CSS for injected functionality
  const style = document.createElement('style');
  style.textContent = `
    .tweetexport-bulk-mode [data-testid="tweet"],
    .tweetexport-bulk-mode article {
      cursor: pointer !important;
      position: relative !important;
    }
    
    .tweetexport-bulk-mode [data-testid="tweet"]:hover,
    .tweetexport-bulk-mode article:hover {
      background: rgba(29, 161, 242, 0.05) !important;
    }
    
    .tweetexport-selected {
      background: rgba(29, 161, 242, 0.1) !important;
      border-left: 3px solid #1da1f2 !important;
    }
    
    .tweetexport-toolbar {
      position: fixed !important;
      bottom: 20px !important;
      left: 50% !important;
      transform: translateX(-50%) !important;
      background: rgba(0, 0, 0, 0.9) !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 25px !important;
      z-index: 10001 !important;
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      backdrop-filter: blur(10px) !important;
      -webkit-backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
    }
    
    .tweetexport-toolbar button {
      background: #1da1f2 !important;
      color: white !important;
      border: none !important;
      padding: 8px 16px !important;
      border-radius: 16px !important;
      cursor: pointer !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
    }
    
    .tweetexport-toolbar button:hover {
      background: #0d8bd9 !important;
      transform: translateY(-1px) !important;
    }
    
    .tweetexport-toolbar .count {
      font-weight: 600 !important;
      color: #1da1f2 !important;
    }
    
    .tweetexport-notification {
      animation: slideIn 0.3s ease !important;
    }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
  
  console.log('TweetExport injected script loaded successfully');
})();