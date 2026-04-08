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

const nextConfig: NextConfig = {
  // Exclude Windows system directories from output file tracing
  outputFileTracingExcludes: {
    '*': [
      '**/node_modules/@swc/core-win32-x64-msvc/**',
      '**/node_modules/@esbuild/win32-x64/**',
      'C:/Users/*/Cookies/**',
      'C:/Users/*/AppData/**',
      'C:/Users/*/Application Data/**',
      'C:/Users/*/Local Settings/**',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-6860df273959446786e5c3556348f4b4.r2.dev",
      },
    ],
  },

  // Empty Turbopack config to silence migration warning
  turbopack: {},

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      os: false,
    };
    
    // Prevent webpack from following symlinks and restrict module resolution
    config.resolve.symlinks = false;
    
    // Restrict where webpack looks for modules
    config.resolve.modules = ['node_modules', 'src'];
    
    // Add ignored patterns for the build process
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/Cookies/**',
        '**/AppData/**',
        '**/Application Data/**',
        '**/Local Settings/**',
        '**/My Documents/**',
        '**/NetHood/**',
        '**/PrintHood/**',
        '**/Recent/**',
        '**/SendTo/**',
        '**/Start Menu/**',
        '**/Templates/**',
      ],
    };
    
    // Add snapshot options to prevent scanning outside project
    if (config.snapshot) {
      config.snapshot.managedPaths = [/^(.+?[\\/]node_modules[\\/])/];
      config.snapshot.immutablePaths = [];
    }
    
    return config;
  },
};

export default nextConfig;
