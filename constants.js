// Global namespace for Silent Reddit extension
window.SilentReddit = window.SilentReddit || {};

// Default settings
SilentReddit.DEFAULT_SETTINGS = {
    enabled: true,
    blockAds: true,
    blockMedia: true,
    replaceLogo: true
};

// Data attribute names for state management (using sr- prefix for Silent Reddit)
SilentReddit.DATA_ATTRS = {
    AD_HIDDEN: 'data-sr-ad-hidden',
    MEDIA_PLACEHOLDER: 'data-sr-media-placeholder',
    MEDIA_HIDDEN: 'data-sr-media-hidden',
    ICON_REPLACED: 'data-sr-icon-replaced',
    LOGO_REPLACED: 'data-sr-logo-replaced',
    BANNER_PROCESSED: 'data-sr-banner-processed',
    ORIGINAL_SRC: 'data-sr-original-src',
    ORIGINAL_STYLE: 'data-sr-original-style',
    ORIGINAL_CONTENT: 'data-sr-original-content',
    ORIGINAL_BANNER_BG: 'data-sr-original-banner-bg'
};

// CSS selectors for querying elements
SilentReddit.SELECTORS = {
    // Ad selectors
    ADS: 'shreddit-ad-post, shreddit-comments-page-ad, games-section-badge-controller, shreddit-gallery-carousel',

    // Media selectors
    MEDIA_CONTAINER: '[slot="post-media-container"]',
    THUMBNAIL: '[slot="thumbnail"], [data-testid*="thumbnail"]',
    COMMUNITY_STATUS: 'community-status-tooltip, community-status',
    COMMENT_MEDIA: 'shreddit-player-2, figure.rte-media',
    FACEPLATE_GIF: 'faceplate-gif',

    // Icon selectors
    SUBREDDIT_ICON: '.shreddit-subreddit-icon__icon:not(svg), .post-credit-row span[rpl][avatar] img[alt*="r/"]',
    USER_AVATAR_IMG: 'a[href*="/user/"] img, [slot*="Avatar"] img, [data-testid*="search-"] img, img[data-testid*="subreddit-icon"]',
    SNOOVATAR: '.snoovatar',
    AVATAR_CONTAINER: '[slot="commentAvatar"] [rpl][avatar]',
    MODERATOR_LIST_ITEM: 'faceplate-tracker[source="moderator_list"]',

    // Shadow DOM selectors
    NAV_COMMUNITIES_CONTROLLER: 'left-nav-communities-controller',
    NAV_COMMUNITY_ITEM: 'left-nav-community-item',
    RECENT_PAGES: 'reddit-recent-pages',

    // Logo selector
    REDDIT_LOGO: 'a#reddit-logo[href="/"]',

    // Banner selector
    COMMUNITY_BANNER: '.community-banner',

    // Query selectors for elements with specific data attributes
    MEDIA_WITH_PLACEHOLDER: '[slot="post-media-container"][data-sr-media-placeholder]',
    THUMBNAIL_HIDDEN: '[slot="thumbnail"][data-sr-media-hidden], [data-testid*="thumbnail"][data-sr-media-hidden]',
    COMMUNITY_STATUS_HIDDEN: 'community-status-tooltip[data-sr-media-hidden], community-status[data-sr-media-hidden]',
    COMMENT_MEDIA_HIDDEN: 'shreddit-player-2[data-sr-media-hidden], figure.rte-media[data-sr-media-hidden]',
    FACEPLATE_GIF_HIDDEN: 'faceplate-gif[data-sr-media-hidden]',
    ICON_REPLACED: '[data-sr-icon-replaced]',
    BANNER_PROCESSED: '.community-banner[data-sr-banner-processed]'
};

// Avatar color palette for letter avatars
SilentReddit.AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
];

// CSS classes used by the extension
SilentReddit.CSS_CLASSES = {
    TEXT_PLACEHOLDER: 'silent-reddit-text-placeholder',
    LETTER_AVATAR: 'silent-reddit-letter-avatar'
};

console.log('[SR] Constants module loaded');
