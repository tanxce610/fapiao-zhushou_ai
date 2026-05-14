/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * 通过局域网 IP（如 http://192.168.0.39:3000）访问 dev 时，Next 会拦截跨源请求，
   * 导致字体 403、/_next/webpack-hmr WebSocket 失败，进而页面异常。
   * 按需把本机局域网 IP 或通配域名加进来；仅 development 生效。
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
   */
  allowedDevOrigins: ["192.168.0.39", "127.0.0.1", "localhost"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
