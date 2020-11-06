module.exports = {
  root: true,
  settings: {
    react: {
      "version": "detect"
    }
  },
  plugins: [
    "prettier",
    "@typescript-eslint",
    "react-hooks",
    "react"
  ],
  env: {
    es6: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended",
    "prettier",
    "prettier/react",
    "plugin:react/recommended"
  ],
  rules: {
    "prettier/prettier": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-floating-promises": "error",
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "warn" // Checks effect dependencies
  },
  parserOptions: {
    project: ["./tsconfig.json", "./__tests__/tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  overrides: [],
};
