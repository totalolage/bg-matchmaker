const plugin = require("tailwindcss/plugin");

module.exports = plugin(function ({ matchUtilities, theme }) {
  // Define spacing values
  const spacingValues = theme("spacing");

  // Helper to create calc() expression
  const createCalcExpression = (value, envVar) => {
    return `calc(${value} + ${envVar})`;
  };

  // Map of safe area environment variables
  const safeAreaVars = {
    t: "env(safe-area-inset-top)",
    b: "env(safe-area-inset-bottom)",
    l: "env(safe-area-inset-left)",
    r: "env(safe-area-inset-right)",
  };

  // Create padding utilities
  matchUtilities(
    {
      "p-s": value => ({
        paddingTop: createCalcExpression(value, safeAreaVars.t),
        paddingBottom: createCalcExpression(value, safeAreaVars.b),
        paddingLeft: createCalcExpression(value, safeAreaVars.l),
        paddingRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "pt-s": value => ({
        paddingTop: createCalcExpression(value, safeAreaVars.t),
      }),
      "pb-s": value => ({
        paddingBottom: createCalcExpression(value, safeAreaVars.b),
      }),
      "pl-s": value => ({
        paddingLeft: createCalcExpression(value, safeAreaVars.l),
      }),
      "pr-s": value => ({
        paddingRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "px-s": value => ({
        paddingLeft: createCalcExpression(value, safeAreaVars.l),
        paddingRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "py-s": value => ({
        paddingTop: createCalcExpression(value, safeAreaVars.t),
        paddingBottom: createCalcExpression(value, safeAreaVars.b),
      }),
    },
    { values: spacingValues },
  );

  matchUtilities(
    {
      "m-s": value => ({
        marginTop: createCalcExpression(value, safeAreaVars.t),
        marginBottom: createCalcExpression(value, safeAreaVars.b),
        marginLeft: createCalcExpression(value, safeAreaVars.l),
        marginRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "mt-s": value => ({
        marginTop: createCalcExpression(value, safeAreaVars.t),
      }),
      "mb-s": value => ({
        marginBottom: createCalcExpression(value, safeAreaVars.b),
      }),
      "ml-s": value => ({
        marginLeft: createCalcExpression(value, safeAreaVars.l),
      }),
      "mr-s": value => ({
        marginRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "mx-s": value => ({
        marginLeft: createCalcExpression(value, safeAreaVars.l),
        marginRight: createCalcExpression(value, safeAreaVars.r),
      }),
      "my-s": value => ({
        marginTop: createCalcExpression(value, safeAreaVars.t),
        marginBottom: createCalcExpression(value, safeAreaVars.b),
      }),
    },
    { values: spacingValues },
  );

  // Create position utilities for fixed/absolute positioning
  matchUtilities(
    {
      "top-s": value => ({
        top: createCalcExpression(value, safeAreaVars.t),
      }),
      "bottom-s": value => ({
        bottom: createCalcExpression(value, safeAreaVars.b),
      }),
      "left-s": value => ({
        left: createCalcExpression(value, safeAreaVars.l),
      }),
      "right-s": value => ({
        right: createCalcExpression(value, safeAreaVars.r),
      }),
    },
    { values: spacingValues },
  );
});
