/**
 * Silent Reddit - Content Script
 * Handles dynamic content blocking using MutationObserver
 */

// Add a text placeholder next to blocked images
function addImagePlaceholder(img) {
    // Skip if already processed
    if (img.dataset.silentRedditProcessed) {
        return;
    }
    
    // Preserve subreddit icons
    if (img.classList.contains('shreddit-subreddit-icon__icon')) {
        return;
    }
    
    // Preserve user avatars
    const parentLink = img.closest('a[href*="/user/"]');
    if (parentLink) {
        return;
    }
    
    // Preserve small UI icons (likely emoji or decorative icons)
    const computedStyle = window.getComputedStyle(img);
    const displayWidth = parseInt(computedStyle.width) || img.width || 0;
    const displayHeight = parseInt(computedStyle.height) || img.height || 0;
    if (displayWidth < 32 && displayHeight < 32) {
        return;
    }
    
    // Mark image as processed
    img.dataset.silentRedditProcessed = 'true';
    
    // Find the media container
    const mediaContainer = img.closest('[slot="post-media-container"]') || 
                          img.closest('shreddit-player') ||
                          img.closest('[data-click-id="media"]') ||
                          img.closest('figure') ||
                          img.parentElement;
    
    if (mediaContainer) {
        // Check if this container already has a placeholder
        if (mediaContainer.dataset.silentRedditPlaceholder) {
            return;
        }
        
        // Mark container as processed
        mediaContainer.dataset.silentRedditPlaceholder = 'true';
        
        // Hide the entire container
        mediaContainer.style.display = 'none';
        
        // Create text placeholder
        const placeholder = document.createElement('span');
        placeholder.className = 'silent-reddit-text-placeholder';
        placeholder.textContent = '[Image]';
        
        // Insert placeholder after the container
        if (mediaContainer.parentNode) {
            mediaContainer.parentNode.insertBefore(placeholder, mediaContainer.nextSibling);
        }
    }
}

// Apply blocking rules to existing and new elements
function applyBlockingRules(targetNode = document.body) {
    if (!targetNode) return;

    // Block ad posts (shreddit-ad-post elements)
    const adPosts = targetNode.querySelectorAll ? 
        targetNode.querySelectorAll('shreddit-ad-post') : 
        [];
    adPosts.forEach(ad => {
        ad.style.display = 'none';
    });

    // Process post images
    // Use broader selectors to catch all images in posts and comments
    const selectors = [
        'article img',           // Images in article elements (feed)
        'shreddit-post img',     // Images in post elements
        '#main-content img',     // Images in main content area
        '[slot="post-media-container"] img',  // Images in media containers
        '[data-testid="post-container"] img'  // Images in post containers
    ];
    
    const postImages = targetNode.querySelectorAll ? 
        targetNode.querySelectorAll(selectors.join(', ')) : 
        [];
    
    postImages.forEach(img => {
        addImagePlaceholder(img);
    });

    // Block videos and media players
    const videos = targetNode.querySelectorAll ? 
        targetNode.querySelectorAll('article video, article shreddit-player, shreddit-post video') : 
        [];
    videos.forEach(video => {
        video.style.display = 'none';
    });
}

// Handle mutations from MutationObserver
function handleMutations(mutations) {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            // Process newly added nodes
            mutation.addedNodes.forEach(node => {
                // Only process element nodes
                if (node.nodeType === Node.ELEMENT_NODE) {
                    applyBlockingRules(node);
                }
            });
        }
    });
}

// Initialize MutationObserver
function initObserver() {
    const observerConfig = {
        childList: true,    // Watch for child node changes
        subtree: true,      // Watch all descendants
        attributes: false   // No need to watch attribute changes
    };

    const observer = new MutationObserver(handleMutations);
    observer.observe(document.body, observerConfig);
    
    console.log('Silent Reddit: MutationObserver initialized');
}

// Apply initial blocking rules
function init() {
    console.log('Silent Reddit: Extension loaded');
    
    // Apply rules to existing content
    applyBlockingRules();
    
    // Start observing for dynamic content
    if (document.body) {
        initObserver();
    } else {
        // Wait for body to be available
        document.addEventListener('DOMContentLoaded', initObserver);
    }
}

// Start the extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
