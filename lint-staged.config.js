export default {
  "*.{ts,tsx}": [
    () => "bun run typecheck",
    "eslint --fix --max-warnings 0 --no-warn-ignored",
  ],
  "*.{js,jsx,ts,tsx,json,css,scss,md}": ["prettier --write"],
};
