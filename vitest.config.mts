import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        // Next 16 treats `next/font/local` as a build-time loader target:
        // the published module is an empty placeholder, so a plain Node
        // import (the root layout's import chain in the source-level
        // tests) would resolve to nothing. Point it at the small test
        // double instead; see tests/stubs/next-font-local.ts.
        find: "next/font/local",
        replacement: fileURLToPath(
          new URL("./tests/stubs/next-font-local.ts", import.meta.url),
        ),
      },
    ],
  },
  oxc: {
    // Vite 8 transforms with oxc, which honours the JSX setting it finds in
    // tsconfig.json. Compile JSX explicitly with React's automatic runtime so
    // the page module can be imported in a plain Node test without a browser.
    jsx: {
      runtime: "automatic",
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
