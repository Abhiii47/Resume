module.exports = (async () => {
  const { nextJsConfig } = await import("@repo/eslint-config/next-js");

  /** @type {import("eslint").Linter.Config[]} */
  return [
    ...nextJsConfig,
    {
      files: [
        "*.config.js",
        "next.config.js",
        "postcss.config.js",
        "tailwind.config.js",
      ],
      languageOptions: {
        globals: {
          module: "readonly",
        },
      },
    },
    {
      rules: {
        "react/no-unknown-property": ["warn", { ignore: ["jsx", "global"] }],
      },
    },
  ];
})();
