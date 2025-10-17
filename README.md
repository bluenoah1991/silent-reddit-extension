# Silent Reddit

A Chrome extension to block ads and images on Reddit for distraction-free browsing during work hours.

## Features

- **Ad Blocking**: Removes all promoted posts and advertisements from Reddit
- **Image Blocking**: Hides post images and thumbnails while preserving:
  - User avatars
  - Subreddit icons
  - UI elements and emojis
- **Dynamic Content Support**: Automatically handles scroll-loaded content
- **Language-Agnostic**: Works on Reddit in any language (English, Chinese, French, etc.)

## Installation

Since this extension is not published on the Chrome Web Store, you need to install it manually in developer mode.

### Prerequisites

- Google Chrome browser (version 88 or higher)
- Node.js (for building the extension)

### Steps

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd silent-reddit-extension
   ```

2. **Build the extension**
   ```bash
   npm run build
   ```
   
   This will create an `out/` directory containing the extension files.

3. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in the top-right corner)
   - Click "Load unpacked"
   - Select the `out/` directory from this project

4. **Start browsing Reddit**
   - Visit [reddit.com](https://www.reddit.com)
   - Ads and images should now be blocked automatically

## Development

### Project Structure

```
silent-reddit-extension/
├── manifest.json         # Chrome extension configuration
├── content.js            # Content script with blocking logic
├── styles.css            # CSS rules for blocking ads and images
├── build.js              # Build script
├── package.json          # npm configuration
├── .gitignore            # Git ignore rules
└── out/                  # Build output directory (created by npm run build)
```

### Development Workflow

1. **Initial setup**
   ```bash
   npm run build
   ```
   Load the `out/` directory in Chrome as described in the installation steps.

2. **Development mode**
   ```bash
   npm run watch
   ```
   This will watch for file changes and automatically rebuild the extension.

3. **Testing changes**
   - Edit source files (`content.js`, `styles.css`, etc.)
   - The watch script will automatically rebuild to `out/`
   - Go to `chrome://extensions/` and click the refresh button on the Silent Reddit extension
   - Refresh the Reddit page to see your changes

### npm Scripts

- `npm run build` - Build the extension to the `out/` directory
- `npm run watch` - Watch for file changes and automatically rebuild

## Technical Details

### Blocking Strategy

#### Ad Blocking
- Uses the `shreddit-ad-post` custom element tag to identify ads
- Language-agnostic approach (no text matching)
- Works across all Reddit language interfaces

#### Image Blocking
- Blocks images using slot attributes (`slot="thumbnail"`, `slot="image-gallery"`)
- Fallback strategy for images without slot attributes
- Preserves specific elements:
  - User avatars (identified by parent link pattern `a[href*="/user/"]`)
  - Subreddit icons (identified by class `.shreddit-subreddit-icon__icon`)

#### Dynamic Content
- Uses `MutationObserver` to detect dynamically loaded content
- Automatically applies blocking rules to new posts as you scroll
- Supports Reddit's single-page application architecture

### Browser Compatibility

- Chrome 88+ (Manifest V3)
- Edge 88+ (Chromium-based)

## Limitations

- Manual refresh required in Chrome after rebuilding (Chrome security restrictions)
- Extension must be loaded in developer mode (not published on Chrome Web Store)
- Reddit UI changes may require selector updates

## Contributing

This is a personal project for office use. If you find bugs or have suggestions, feel free to open an issue.

## License

MIT License - See LICENSE file for details

## Privacy

This extension:
- Does not collect any user data
- Does not make any network requests
- Does not require any special permissions
- Runs entirely locally in your browser
