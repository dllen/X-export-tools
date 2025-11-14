# TweetExport - Twitter(X) Content Exporter

A powerful Chrome extension that allows you to export your Twitter(X) tweets and multimedia content with ease.

## Features

### 🚀 Core Functionality
- **Tweet Export**: Export individual tweets or bulk collections
- **Media Support**: Download images and videos along with tweets
- **Multiple Formats**: Export as JSON, CSV, or plain text
- **Smart Filtering**: Filter by date range, content type, and engagement

### 🔧 Advanced Features
- **Bulk Selection**: Select multiple tweets for batch export
- **Real-time Updates**: Automatically detect new tweets on the page
- **Customizable Export**: Configure filename patterns and export options

### 🎨 User Experience
- **Intuitive Interface**: Clean, modern design with easy navigation
- **Progress Tracking**: Visual progress indicators during exports
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Automatically adapts to your system preferences

## Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "TweetExport"
3. Click "Add to Chrome"
4. Grant necessary permissions

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the extension directory
6. The extension icon will appear in your toolbar

## Usage

### Quick Start
1. **Navigate**: Go to any Twitter profile or timeline
2. **Export**: Click the export button on individual tweets or use bulk selection

### Individual Tweet Export
1. Hover over any tweet on Twitter
2. Click the 📥 export button that appears
3. Choose your export format and options
4. Download the exported file

### Bulk Export
1. Click the extension icon
2. Configure your export settings (date range, content types, etc.)
3. Click "Export Tweets"
4. The extension will scan the current page and export matching tweets

### Bulk Selection Mode
1. Right-click on the page and select "TweetExport" → "Start Bulk Selection"
2. Click on tweets to select them (selected tweets will be highlighted)
3. Use the toolbar to select all or export selected tweets
4. Click "Export Selected" to download

## Settings

Access the settings page by:
- Clicking "Settings" in the extension popup
- Right-clicking the extension icon → "Options"

### Available Settings

#### Export Settings
- **Include Media**: Download images and videos
- **Include Replies**: Export reply tweets
- **Include Retweets**: Include retweets in exports
- **Include Metrics**: Export engagement data (likes, retweets, replies)

#### Format Settings
- **Default Format**: Choose between JSON, CSV, or plain text
- **Filename Pattern**: Customize exported filenames using placeholders
  - `{username}` - Twitter username
  - `{date}` - Export date
  - `{time}` - Export time

#### Display Settings
- **Export Buttons**: Show/hide individual tweet export buttons
- **Button Position**: Choose where export buttons appear
- **Bulk Selection**: Enable/disable bulk selection mode

#### Advanced Settings
- **Maximum Tweets**: Limit exports to prevent memory issues
- **API Delay**: Adjust delay between API requests
- **Debug Mode**: Enable detailed logging for troubleshooting

## File Formats

### JSON Format
```json
{
  "exportDate": "2025-11-14T12:00:00.000Z",
  "tweetCount": 100,
  "tweets": [
    {
      "id": "1234567890",
      "text": "Tweet content here...",
      "author": {
        "name": "John Doe",
        "username": "@johndoe"
      },
      "timestamp": "2025-11-14T10:30:00.000Z",
      "metrics": {
        "replies": 5,
        "retweets": 10,
        "likes": 50
      },
      "media": {
        "images": [{"url": "image_url", "alt": "description"}],
        "videos": []
      },
      "url": "https://twitter.com/johndoe/status/1234567890"
    }
  ]
}
```

### CSV Format
```csv
ID,Text,Author,Username,Date,Replies,Retweets,Likes,URL
1234567890,"Tweet content here...",John Doe,@johndoe,2025-11-14T10:30:00.000Z,5,10,50,https://twitter.com/johndoe/status/1234567890
```

## Privacy & Security

- **Local Processing**: All tweet extraction happens locally in your browser
- **No Data Collection**: We don't collect or store your personal data
- **Minimal Permissions**: Only requests necessary permissions

## Troubleshooting

### Common Issues

#### Extension Not Working
1. Ensure you're on twitter.com or x.com
2. Check if the extension is enabled in `chrome://extensions/`
3. Try refreshing the page


#### Export Failures
1. Check your internet connection
2. Try reducing the number of tweets to export
3. Enable debug mode for detailed error messages

#### Missing Export Buttons
1. Check if "Show export buttons" is enabled in settings
2. Ensure the page has fully loaded
3. Try scrolling to load more tweets

### Debug Mode
Enable debug mode in settings to see detailed console logs:
1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Look for "TweetExport" prefixed messages

## Development

### Project Structure
```
tweetexport/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── content.js             # Content script for Twitter pages
├── content.css            # Styles for content script
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── popup.css              # Popup styles
├── settings.html          # Settings page
├── settings.js            # Settings functionality
├── settings.css           # Settings styles
├── injected.js            # Injected utilities
├── icons/                 # Extension icons
└── README.md             # This file
```

### Building from Source
1. Clone the repository
2. Make your changes
3. Test in Chrome developer mode
4. Package as .zip for distribution

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this README first
- **Chrome Web Store**: Leave reviews and feedback

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0 (2025-11-14)
- Initial release
- Basic tweet export functionality
- Bulk selection mode
- Multiple export formats
- Settings page

## Disclaimer

This extension is not affiliated with Twitter(X). Use responsibly and in accordance with Twitter's Terms of Service. The developers are not responsible for any misuse of this tool.