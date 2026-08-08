import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/"],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        AbortSignal: "readonly",
        console: "readonly",
        fetch: "readonly",
        Intl: "readonly",
        process: "readonly",
      },
    },
  },
];
