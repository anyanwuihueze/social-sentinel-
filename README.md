# Social Sentinel

Social Sentinel is a full-stack Next.js application that provides tools to monitor social media platforms like Telegram and TikTok for specific keywords, analyze message sentiment, and automate responses.

## Features

- **Dashboard**: A central hub to access the Telegram and TikTok bots.
- **Telegram Visa Bot**: Monitor Telegram groups for visa-related discussions, analyze sentiment, and post automated replies based on a configurable persona.
- **TikTok Visa Bot**: Monitor TikTok comments on specific hashtags, analyze sentiment, and automatically post replies.
- **Live Logs**: Real-time log streaming to monitor bot activity.
- **Proxy Support**: Configure and test a proxy for all bot operations.
- **Dark Mode**: A sleek dark mode for comfortable viewing.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd social-sentinel
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Set up environment variables:
    Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env.local.example .env.local
    ```
    Then, fill in your Supabase and Proxy details in the `.env.local` file.

    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    PROXY_URL=your_proxy_url
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## Deployment

This application is configured for deployment on [Vercel](https://vercel.com/).

1.  Push your code to a GitHub repository.
2.  Import the repository on Vercel.
3.  Vercel will automatically detect the Next.js project and configure the build settings.
4.  Add your environment variables in the Vercel project settings.
5.  Deploy!
# social-sentinel-
