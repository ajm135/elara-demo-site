import { defineConfig } from "vitest/config";

export default defineConfig({
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
