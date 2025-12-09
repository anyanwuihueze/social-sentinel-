# **App Name**: Social Sentinel

## Core Features:

- Dashboard: Central dashboard with links to Telegram and TikTok Visa Bots, and proxy status indicator.
- Telegram Visa Bot Configuration: Configure the Telegram bot with group invite links, keywords, sentiment slider, and persona selection.  This includes persisting settings to the 'other' database.
- TikTok Visa Bot Configuration: Configure the TikTok bot with hashtags, max daily comments, comment template, and sentiment threshold.  This includes persisting settings to the 'other' database.
- Telegram Message Monitoring: Use Puppeteer to monitor Telegram groups for visa-related keywords, analyze sentiment, and respond based on configured settings. Inserts message data and bot responses into the 'other' database.
- TikTok Commenting: Use Puppeteer to search TikTok hashtags, analyze sentiment of comments, and post replies if sentiment is below the configured threshold. Inserts comment data and bot responses into the 'other' database.
- Live Log Streaming: Provide a live log panel via websockets or SSE, showing incoming messages, sentiment analysis results, and bot replies.  Provides direct feedback to the user to the system in the trenches.
- Proxy Tester: A simple API route that allows a user to quickly and simply test a proxy URL with its IP and current status.

## Style Guidelines:

- Primary color: Saturated blue (#2979FF) to convey trust and security.
- Background color: Light gray (#F0F2F5) to ensure readability and a clean interface.
- Accent color: Purple (#BB86FC) to highlight interactive elements and calls to action.
- Body and headline font: 'Inter' (sans-serif) for a modern and neutral look. The font is versatile, lending itself to both headlines and body text.
- Use consistent, outline-style icons from a library like FontAwesome or Material Icons.
- Responsive layout using Tailwind CSS grid and flexbox for optimal viewing on all devices.
- Subtle transitions and animations to provide feedback on user interactions.