// Content script for TweetExport extension - interacts with Twitter(X) pages

class TweetExportContent {
  constructor() {
    this.tweets = new Map();
    this.isProcessing = false;
    this.observer = null;
    this.init();
  }

  init() {
    console.log('TweetExport content script initialized');
    this.setupTweetObserver();
    this.bindMessageListener();
    this.scanExistingTweets();
  }

  // Setup mutation observer to detect new tweets
  setupTweetObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tweets = this.extractTweetsFromElement(node);
            tweets.forEach(tweet => this.processTweet(tweet));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Extract tweets from DOM element
  extractTweetsFromElement(element) {
    const tweets = [];
    
    // Look for tweet containers using various selectors
    const tweetSelectors = [
      '[data-testid="tweet"]',
      '[data-testid="tweetText"]',
      'article[data-testid="tweet"]',
      'div[data-testid="tweet"]'
    ];

    tweetSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(tweetElement => {
        if (!tweets.includes(tweetElement)) {
          tweets.push(tweetElement);
        }
      });
    });

    return tweets;
  }

  // Process individual tweet element
  processTweet(tweetElement) {
    if (this.isProcessing) return;
    
    try {
      const tweetData = this.extractTweetData(tweetElement);
      if (tweetData && tweetData.id) {
        this.tweets.set(tweetData.id, tweetData);
        this.addExportButton(tweetElement, tweetData);
      }
    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }

  // Extract tweet data from DOM
  extractTweetData(tweetElement) {
    try {
      const tweetData = {
        id: this.extractTweetId(tweetElement),
        text: this.extractTweetText(tweetElement),
        author: this.extractAuthorInfo(tweetElement),
        timestamp: this.extractTimestamp(tweetElement),
        metrics: this.extractMetrics(tweetElement),
        media: this.extractMedia(tweetElement),
        url: this.extractTweetUrl(tweetElement)
      };

      return tweetData.id ? tweetData : null;
    } catch (error) {
      console.error('Error extracting tweet data:', error);
      return null;
    }
  }

  // Extract tweet ID
  extractTweetId(tweetElement) {
    // Try multiple methods to extract tweet ID
    const idSelectors = [
      '[data-testid="tweet"]',
      'article',
      'div[role="group"]'
    ];

    // Look for href containing status ID
    const links = tweetElement.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const match = link.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }

    // Look for data attributes
    const tweetId = tweetElement.getAttribute('data-tweet-id') || 
                   tweetElement.closest('[data-tweet-id]')?.getAttribute('data-tweet-id');
    
    return tweetId || this.generateTweetId(tweetElement);
  }

  // Extract tweet text content
  extractTweetText(tweetElement) {
    const textSelectors = [
      '[data-testid="tweetText"]',
      'div[lang]',
      '.tweet-text',
      'p'
    ];

    for (const selector of textSelectors) {
      const textElement = tweetElement.querySelector(selector);
      if (textElement) {
        return textElement.textContent.trim();
      }
    }

    return tweetElement.textContent.trim().substring(0, 280);
  }

  // Extract author information
  extractAuthorInfo(tweetElement) {
    const authorData = {
      name: '',
      username: '',
      profileImage: ''
    };

    // Extract display name
    const nameSelectors = [
      '[data-testid="User-Name"] a',
      'div[dir="ltr"] span',
      '.fullname',
      'strong'
    ];

    for (const selector of nameSelectors) {
      const nameElement = tweetElement.querySelector(selector);
      if (nameElement) {
        authorData.name = nameElement.textContent.trim();
        break;
      }
    }

    // Extract username
    const usernameSelectors = [
      '[data-testid="User-Name"] a[href^="/"]',
      'div[dir="ltr"] a[href^="/"]',
      '.username',
      'span[dir="ltr"]'
    ];

    for (const selector of usernameSelectors) {
      const usernameElement = tweetElement.querySelector(selector);
      if (usernameElement) {
        const username = usernameElement.textContent.trim();
        authorData.username = username.startsWith('@') ? username : `@${username}`;
        break;
      }
    }

    // Extract profile image
    const imgElement = tweetElement.querySelector('img[src*="profile"]') ||
                      tweetElement.querySelector('img[alt*="profile"]') ||
                      tweetElement.querySelector('img');
    
    if (imgElement) {
      authorData.profileImage = imgElement.src;
    }

    return authorData;
  }

  // Extract timestamp
  extractTimestamp(tweetElement) {
    const timeSelectors = [
      'time',
      'a[href*="/status/"] time',
      '[datetime]'
    ];

    for (const selector of timeSelectors) {
      const timeElement = tweetElement.querySelector(selector);
      if (timeElement) {
        const datetime = timeElement.getAttribute('datetime');
        if (datetime) {
          return new Date(datetime).toISOString();
        }
        return timeElement.textContent.trim();
      }
    }

    return new Date().toISOString();
  }

  // Extract engagement metrics
  extractMetrics(tweetElement) {
    const metrics = {
      replies: 0,
      retweets: 0,
      likes: 0,
      views: 0
    };

    // Reply count
    const replyElement = tweetElement.querySelector('[data-testid="reply"]') ||
                        tweetElement.querySelector('[aria-label*="reply"]');
    if (replyElement) {
      metrics.replies = this.extractNumber(replyElement.textContent);
    }

    // Retweet count
    const retweetElement = tweetElement.querySelector('[data-testid="retweet"]') ||
                          tweetElement.querySelector('[aria-label*="retweet"]');
    if (retweetElement) {
      metrics.retweets = this.extractNumber(retweetElement.textContent);
    }

    // Like count
    const likeElement = tweetElement.querySelector('[data-testid="like"]') ||
                       tweetElement.querySelector('[aria-label*="like"]');
    if (likeElement) {
      metrics.likes = this.extractNumber(likeElement.textContent);
    }

    // View count (if available)
    const viewElement = tweetElement.querySelector('[aria-label*="view"]') ||
                         tweetElement.querySelector('[data-testid="view"]');
    if (viewElement) {
      metrics.views = this.extractNumber(viewElement.textContent);
    }

    return metrics;
  }

  // Extract media content
  extractMedia(tweetElement) {
    const media = {
      images: [],
      videos: [],
      gifs: []
    };

    // Images
    const imageElements = tweetElement.querySelectorAll('img[src*="pbs.twimg.com"]');
    imageElements.forEach(img => {
      if (img.src.includes('media') && !img.src.includes('profile')) {
        media.images.push({
          url: img.src,
          alt: img.alt || ''
        });
      }
    });

    // Videos
    const videoElements = tweetElement.querySelectorAll('video');
    videoElements.forEach(video => {
      media.videos.push({
        url: video.src || video.querySelector('source')?.src,
        poster: video.poster
      });
    });

    return media;
  }

  // Extract tweet URL
  extractTweetUrl(tweetElement) {
    const linkElement = tweetElement.querySelector('a[href*="/status/"]');
    if (linkElement) {
      return `https://twitter.com${linkElement.getAttribute('href')}`;
    }
    
    // Construct URL from tweet ID
    const tweetId = this.extractTweetId(tweetElement);
    const author = this.extractAuthorInfo(tweetElement);
    if (tweetId && author.username) {
      return `https://twitter.com/${author.username.replace('@', '')}/status/${tweetId}`;
    }

    return '';
  }

  // Helper function to extract numbers from text
  extractNumber(text) {
    if (!text) return 0;
    const match = text.match(/[\d,]+/);
    return match ? parseInt(match[0].replace(/,/g, '')) : 0;
  }

  // Generate unique ID for tweets without proper IDs
  generateTweetId(element) {
    const text = element.textContent || '';
    const timestamp = Date.now().toString();
    return Math.abs(text.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0)).toString() + timestamp.slice(-6);
  }

  // Add export button to tweet
  addExportButton(tweetElement, tweetData) {
    // Check if button already exists
    if (tweetElement.querySelector('.tweet-export-btn')) return;

    const exportButton = document.createElement('button');
    exportButton.className = 'tweet-export-btn';
    exportButton.innerHTML = '📥';
    exportButton.title = 'Export this tweet';
    exportButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(29, 161, 242, 0.9);
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 12px;
      color: white;
      z-index: 1000;
      opacity: 0.8;
      transition: all 0.2s ease;
    `;

    exportButton.addEventListener('mouseenter', () => {
      exportButton.style.opacity = '1';
      exportButton.style.transform = 'scale(1.1)';
    });

    exportButton.addEventListener('mouseleave', () => {
      exportButton.style.opacity = '0.8';
      exportButton.style.transform = 'scale(1)';
    });

    exportButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.exportSingleTweet(tweetData);
    });

    // Make tweet element position relative if needed
    if (getComputedStyle(tweetElement).position === 'static') {
      tweetElement.style.position = 'relative';
    }

    tweetElement.appendChild(exportButton);
  }

  // Export single tweet
  async exportSingleTweet(tweetData) {
    try {
      // Send tweet data to background script for export
      const response = await chrome.runtime.sendMessage({
        action: 'exportTweets',
        tweets: [tweetData]
      });

      if (response.success) {
        this.showNotification(`Tweet exported successfully!`);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Export failed. Please try again.', 'error');
    }
  }

  // Scan existing tweets on page load
  scanExistingTweets() {
    this.isProcessing = true;
    
    setTimeout(() => {
      const tweets = this.extractTweetsFromElement(document.body);
      tweets.forEach(tweet => this.processTweet(tweet));
      this.isProcessing = false;
      console.log(`Processed ${this.tweets.size} tweets`);
    }, 1000);
  }

  // Bind message listener for communication with popup/background
  bindMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'fetchTweets':
          this.handleFetchTweets(request.options)
            .then(tweets => sendResponse({ tweets }))
            .catch(error => sendResponse({ error: error.message }));
          return true; // Keep message channel open
          
        case 'exportTweet':
          this.handleExportTweet(request.tweetId)
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
          return true;
          
        case 'getPageTweets':
          sendResponse({ tweets: Array.from(this.tweets.values()) });
          break;
      }
    });
  }

  // Handle fetch tweets request from popup
  async handleFetchTweets(options) {
    const allTweets = Array.from(this.tweets.values());
    
    // Filter tweets based on options
    let filteredTweets = allTweets.filter(tweet => {
      // Date range filtering
      if (options.dateFrom || options.dateTo) {
        const tweetDate = new Date(tweet.timestamp);
        const fromDate = options.dateFrom ? new Date(options.dateFrom) : null;
        const toDate = options.dateTo ? new Date(options.dateTo) : null;
        
        if (fromDate && tweetDate < fromDate) return false;
        if (toDate && tweetDate > toDate) return false;
      }
      
      // Content filtering
      if (!options.includeReplies && this.isReply(tweet)) return false;
      if (!options.includeRetweets && this.isRetweet(tweet)) return false;
      
      return true;
    });

    return filteredTweets;
  }

  // Handle single tweet export
  async handleExportTweet(tweetId) {
    const tweet = this.tweets.get(tweetId);
    if (!tweet) {
      throw new Error('Tweet not found');
    }
    
    return await this.exportSingleTweet(tweet);
  }

  // Helper functions
  isReply(tweet) {
    return tweet.text.startsWith('@') || tweet.text.includes('Replying to');
  }

  isRetweet(tweet) {
    return tweet.text.includes('RT @') || tweet.text.startsWith('Retweeted');
  }

  showNotification(message, type = 'success') {
    // Create notification element
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

    // Add animation styles
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
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
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

// Initialize content script when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TweetExportContent();
  });
} else {
  new TweetExportContent();
}