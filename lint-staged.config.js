export default {
  "*.{ts,tsx}": [
    () => "bunx tsc-files",
    "eslint --fix --max-warnings 0 --no-warn-ignored",
  ],
  "*.{js,jsx,ts,tsx,json,css,scss,md}": ["prettier --write"],
};
