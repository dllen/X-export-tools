// Background service worker for TweetExport extension
let authToken = null;
let userData = null;

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
    case 'getAuthToken':
      sendResponse({ token: authToken });
      break;
      
    case 'setAuthToken':
      authToken = request.token;
      chrome.storage.local.set({ authToken: request.token });
      sendResponse({ success: true });
      break;
      
    case 'getUserData':
      sendResponse({ userData: userData });
      break;
      
    case 'setUserData':
      userData = request.userData;
      chrome.storage.local.set({ userData: request.userData });
      sendResponse({ success: true });
      break;
      
    case 'exportTweets':
      handleTweetExport(request.tweets)
        .then(result => sendResponse({ success: true, result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    case 'fetchTwitterData':
      fetchTwitterData(request.endpoint, request.params)
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// Load stored data on startup
chrome.storage.local.get(['authToken', 'userData'], (result) => {
  if (result.authToken) authToken = result.authToken;
  if (result.userData) userData = result.userData;
});

// Handle Twitter API requests
async function fetchTwitterData(endpoint, params = {}) {
  if (!authToken) {
    throw new Error('No authentication token available');
  }
  
  const url = new URL(`https://api.twitter.com/2/${endpoint}`);
  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Twitter API error: ${response.status}`);
  }
  
  return response.json();
}

// Handle tweet export functionality
async function handleTweetExport(tweets) {
  const exportData = {
    exportDate: new Date().toISOString(),
    tweetCount: tweets.length,
    tweets: tweets
  };
  
  // Create downloadable file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const filename = `tweets_export_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
  
  // Download file
  await chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  });
  
  return { filename, tweetCount: tweets.length };
}

// Handle Twitter OAuth flow
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
  if (signedIn) {
    console.log('User signed in:', account);
  } else {
    console.log('User signed out');
    authToken = null;
    userData = null;
    chrome.storage.local.remove(['authToken', 'userData']);
  }
});