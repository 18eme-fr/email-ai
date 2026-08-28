/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // MapLibre ships as an ESM/UMD bundle that is happiest transpiled by Next.
  transpilePackages: ['maplibre-gl'],
};

export default nextConfig;
