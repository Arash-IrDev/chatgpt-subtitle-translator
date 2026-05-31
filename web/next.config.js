/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const basePath = isGitHubPages ? '/chatgpt-subtitle-translator' : ''

const nextConfig = {
  output: 'export',
  basePath,
  distDir: isGitHubPages ? 'chatgpt-subtitle-translator' : 'out',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async rewrites() {
    if (isGitHubPages) {
      return []
    }
    return [
      {
        source: '/ollama/:path*',
        destination: 'http://localhost:11434/:path*',
      },
    ]
  },
}

module.exports = nextConfig
