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
    rules: {
      // Unused variables - allow underscore-prefixed args and variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],
      // Allow any for API responses and catch blocks - TODO: add proper types incrementally
      "@typescript-eslint/no-explicit-any": "off",
      // Allow exhaustive deps warnings - many intentional patterns (run-once effects)
      "react-hooks/exhaustive-deps": "warn",
      // Allow <img> for external images not compatible with next/image
      "@next/next/no-img-element": "warn",
    },
  },
];

export default eslintConfig;
