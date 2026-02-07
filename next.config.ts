// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'pub-6860df273959446786e5c3556348f4b4.r2.dev',
//       },
//     ],
//   },
//   webpack: (config) => {
//     config.resolve.fallback = {
//       fs: false,
//       path: false,
//       os: false,
//     };
//     return config;
//   },
// };

// export default nextConfig;
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ✅ MOVED OUT OF experimental IN NEXT 15
  outputFileTracingRoot: path.join(__dirname),

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-6860df273959446786e5c3556348f4b4.r2.dev",
      },
    ],
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    return config;
  },
};

export default nextConfig;
