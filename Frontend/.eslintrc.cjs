module.exports = {
  root: true,
  ignorePatterns: ["dist/**", "node_modules/**"],
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  plugins: ["react-hooks"],
  extends: ["plugin:react-hooks/recommended"],
  rules: {
    "no-unused-vars": "off",
    "react-hooks/exhaustive-deps": "off",
  },
};
