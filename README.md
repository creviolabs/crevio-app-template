# Welcome to your Crevio site

## Your place on the internet

This is more than a storefront — it's your AI-powered business running on autopilot. Your products, your brand, your domain. Connected to your [Crevio](https://crevio.co) account, everything stays in sync automatically.

You create. Crevio runs the business.

## How can I edit this site?

There are several ways to make this site your own.

**Use Crevio**

The easiest way — manage your products, content, and settings right from your [Crevio dashboard](https://crevio.co/app/dashboard). Changes show up on your site automatically.

**Use your preferred IDE**

If you want full control, clone this repo and work locally. The only requirement is having Bun installed — [install Bun](https://bun.sh/docs/installation).

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
bun install

# Step 4: Add your API key to .dev.vars
# CREVIO_API_KEY=your_api_key_here

# Step 5: Start the development server with auto-reloading and an instant preview.
bun run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used?

This project is built with:

- [React Router v7](https://reactrouter.com/) — routing and server-side rendering
- [@crevio/sdk](https://www.npmjs.com/package/@crevio/sdk) — data fetching from your Crevio account
- [TailwindCSS 4](https://tailwindcss.com/) — styling and theming
- [Cloudflare Workers](https://workers.cloudflare.com/) — edge deployment
- TypeScript — type safety throughout

## How can I deploy this project?

One command puts your site live on the edge — fast everywhere, scales to zero.

```sh
bun run deploy
```

This deploys to [Cloudflare Workers](https://workers.cloudflare.com/). No servers to manage, no infrastructure to worry about.

## Can I connect a custom domain?

Yes! Your Crevio site should live on your own domain.

To connect a domain, head to your Cloudflare dashboard → Workers & Pages → your project → Settings → Domains. Add your custom domain and follow the DNS setup instructions.

Once connected, your site is available at `yourdomain.com` — fully yours, fully branded.

Read more here: [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## All commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Production build |
| `bun run deploy` | Build and deploy to Cloudflare Workers |
| `bun run typecheck` | Run type checking |
| `bun run check` | Run Biome checks |
