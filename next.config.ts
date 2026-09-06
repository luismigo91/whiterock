import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "**.alisedainmobiliaria.com" },
      { protocol: "https", hostname: "**.servihabitat.com" },
      { protocol: "https", hostname: "**.haya.es" },
      { protocol: "https", hostname: "**.altamirainmuebles.com" },
      { protocol: "https", hostname: "**.solvia.es" },
      { protocol: "https", hostname: "**.anticipa.com" },
      { protocol: "https", hostname: "**.diglo.es" },
    ],
  },
};

export default nextConfig;
