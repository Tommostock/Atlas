import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Machine-generated service worker files — not our code to lint.
      "public/sw.js",
      "public/sw.js.map",
      "public/workbox-*.js",
      "public/workbox-*.js.map",
      "public/fallback-*.js",
    ],
  },
];

export default eslintConfig;
