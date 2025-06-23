import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import reactCompiler from "eslint-plugin-react-compiler";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      "eslint.config.js",
      "convex/_generated",
      "postcss.config.js",
      "tailwind.config.js",
      "vite.config.ts",
      "scripts/**/*.ts", // Scripts have their own tsconfig
    ],
  },
  // Main configuration for src files
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ["./tsconfig.json", "./convex/tsconfig.json"],
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react-compiler": reactCompiler,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      prettier: prettier,
      "no-relative-import-paths": noRelativeImportPaths,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // React Compiler rules
      "react-compiler/react-compiler": "error",
      // All of these overrides ease getting into
      // TypeScript, and can be removed for stricter
      // linting down the line.

      // Only warn on unused variables, and ignore variables starting with `_`
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],

      // Allow escaping the compiler
      "@typescript-eslint/ban-ts-comment": "error",

      // Ban explicit `any`s
      "@typescript-eslint/no-explicit-any": "error",

      // START: Allow implicit `any`s
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // END: Allow implicit `any`s

      // Allow async functions without await
      // for consistency (esp. Convex `handler`s)
      "@typescript-eslint/require-await": "off",

      // Import sorting rules
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Node.js builtins
            ["^node:"],
            // External packages
            ["^@?\\w"],
            // Internal packages
            ["^(@|@convex|convex|src)(/.*|$)"],
            // Side effect imports
            ["^\\u0000"],
            // Parent imports
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Other relative imports
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            // Style imports
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",

      // No unused imports/exports
      "no-unused-vars": "off", // must turn off the base rule as it can report incorrect errors
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],


      // Disallow React optimization hooks since React Compiler handles these
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: ["memo", "useMemo", "useCallback", "forwardRef"],
              message:
                "React Compiler handles memoization automatically. forwardRef is not needed - use ref as a normal prop instead.",
            },
          ],
          patterns: [
            {
              group: ["react"],
              importNames: ["memo", "useMemo", "useCallback", "forwardRef"],
              message:
                "React Compiler handles memoization automatically. forwardRef is not needed - use ref as a normal prop instead.",
            },
            // Prevent relative imports from going outside module boundaries
            {
              group: ["../*/**"],
              message: "Use @/ imports when importing from outside your module. Relative imports should only be used within the same module.",
            },
          ],
        },
      ],

      // Enforce @/ imports for non-sibling directories
      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
          rootDir: "src",
          prefix: "@",
        },
      ],

      // Prettier integration
      "prettier/prettier": "error",

      // Enforce no braces for single-line statements
      curly: ["error", "multi-or-nest", "consistent"],

      // Prefer concise arrow functions without braces for single expressions
      "arrow-body-style": [
        "error",
        "as-needed",
        { requireReturnForObjectLiteral: false },
      ],

      // Allow void operator in arrow functions for event handlers
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
  // Convex files configuration (without module boundary restrictions)
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    files: ["convex/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: ["./convex/tsconfig.json"],
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "react-compiler": reactCompiler,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      prettier: prettier,
    },
    rules: {
      // Copy most rules from main config but exclude module boundary rules
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "react-compiler/react-compiler": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/require-await": "off",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^node:"],
            ["^@?\\w"],
            ["^(@|@convex|convex|src)(/.*|$)"],
            ["^\\u0000"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            ["^.+\\.s?css$"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // Prettier integration
      "prettier/prettier": "error",
      curly: ["error", "multi-or-nest", "consistent"],
      "arrow-body-style": [
        "error",
        "as-needed",
        { requireReturnForObjectLiteral: false },
      ],
      "@typescript-eslint/no-confusing-void-expression": "off",
    },
  },
  // Prettier config needs to be last to override conflicting rules
  prettierConfig,
);
