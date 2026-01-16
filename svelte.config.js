import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  paths: {
    base: process.env.NODE_ENV === "production" ? "/image-comparison-tool" : "",
  },
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
    }),
  },
};

export default config;
