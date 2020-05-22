// Some settings automatically inherited from .editorconfig

module.exports = {
  semi: true,
  trailingComma: "all",
  overrides: [
    {
      files: ".editorconfig",
      options: { parser: "yaml" },
    }
  ],
}
