/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'
const isStaticExport =
  isGitHubPages || process.env.NEXT_STATIC_EXPORT === '1'
const basePath = isGitHubPages ? '/chatgpt-subtitle-translator' : ''

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds — never during `next dev`
  ...(isStaticExport ? { output: 'export' } : {}),
  basePath,
  distDir: isGitHubPages ? 'chatgpt-subtitle-translator' : 'out',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  async rewrites() {
    if (isStaticExport) {
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
