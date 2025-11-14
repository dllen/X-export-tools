// Background service worker for TweetExport extension
const defaultUser = { name: 'Guest', username: 'guest', profile_image_url: 'icons/icon32.png' };

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('TweetExport extension installed');
  
  // Create context menu for tweet export
  chrome.contextMenus.create({
    id: 'exportTweet',
    title: 'Export this tweet',
    contexts: ['all'],
    documentUrlPatterns: ['https://twitter.com/*', 'https://x.com/*']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'exportTweet') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'exportTweet',
      tweetId: info.targetElementId
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'exportTweets':
      handleTweetExport(request.tweets)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
  }
});

// Load stored data on startup
chrome.storage.local.remove(['authToken', 'userData']);

// Handle Twitter API requests
function getDefaultUser() { return defaultUser; }

// Handle tweet export functionality
async function handleTweetExport(tweets) {
  const exportData = {
    exportDate: new Date().toISOString(),
    tweetCount: tweets.length,
    tweets: tweets
  };
  
  const json = JSON.stringify(exportData, null, 2);
  const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
  const filename = `tweets_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  
  await chrome.downloads.download({
    url: dataUrl,
    filename,
    saveAs: true
  });
  
  return { filename, tweetCount: tweets.length };
}

// Handle Twitter OAuth flow