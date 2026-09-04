# WoW Auction House Dashboard

An Astro web application that retrieves, displays, and filters World of Warcraft Auction House data.

## Configuration

Before running the application, you must configure your Battle.net API keys.

1. Go to the [Battle.net Developer Portal](https://develop.battle.net/).
2. Log in and create a new Client to obtain a `Client ID` and `Client Secret`.
3. Copy `.env.example` to a new file called `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Open `.env.local` and add your credentials:
   ```env
   BATTLENET_CLIENT_ID=your_client_id_here
   BATTLENET_CLIENT_SECRET=your_client_secret_here
   BATTLENET_REGION=us
   WOW_CONNECTED_REALM_ID=1146
   ```

*Note: The connected realm ID `1146` is for Area 52 (US). You can look up other connected realm IDs using the Battle.net Game Data API.*

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:4321` in your browser.
