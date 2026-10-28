/** @type {import('next').NextConfig} */
const nextConfig = { // Include Zalo while preserving common social/search preview crawlers.
htmlLimitedBots: /[\w-]+-Google|Google-[\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight|Zalo|TelegramBot|Facebot/i,
images: { unoptimized: true } };
export default nextConfig;
