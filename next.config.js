const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');const { PrismaPlugin } = require('@prisma/nextjs-monorepo-workaround-plugin');



/** @type {import('next').NextConfig} *//** @type {import('next').NextConfig} */

const nextConfig = {const nextConfig = {

  webpack: (config, { isServer }) => {  webpack: (config, { isServer }) => {

    if (isServer) {    if (isServer) {

      config.plugins = [...config.plugins, new PrismaPlugin()];      config.plugins = [...config.plugins, new PrismaPlugin()];

    }    }

    return config;    return config;

  },  },

};};



module.exports = nextConfig;module.exports = nextConfig;NextConfig } from "next";

import { PrismaPlugin } from '@prisma/nextjs-monorepo-workaround-plugin';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
};

export default nextConfig;
