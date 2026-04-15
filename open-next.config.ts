import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  // Next.js 16 defaults to Turbopack for `next build`, but Cloudflare Workers
  // doesn't support require() which the turbo runtime uses. Force webpack.
  buildCommand: "npx next build --webpack",
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "direct",
    },
  },
};

export default config;
