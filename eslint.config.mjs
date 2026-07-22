import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import vitest from "eslint-plugin-vitest";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    ...playwright.configs["flat/recommended"],
    files: ["e2e/**/*.ts"],
  },
  {
    ...vitest.configs.recommended,
    files: ["tests/**/*.ts"],
  },
]);

export default eslintConfig;
