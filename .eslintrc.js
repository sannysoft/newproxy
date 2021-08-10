module.exports = {
  parserOptions: {
    project: 'tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'jest', 'unicorn', 'prettier'],
  extends: ['airbnb-typescript/base', 'prettier'],
  env: {
    node: true,
    browser: false,
    jest: true,
  },
  rules: {
    'prettier/prettier': 'error',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
    '@typescript-eslint/explicit-function-return-type': ['error'],
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars-experimental': 'warn',
    '@typescript-eslint/dot-notation': [
      'error',
      {
        allowKeywords: true,
        allowIndexSignaturePropertyAccess: true,
        allowPrivateClassPropertyAccess: true,
        allowProtectedClassPropertyAccess: true,
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'no-underscore-dangle': 'off',
    'prefer-destructuring': 'off',
    'import/no-cycle': 'warn',
    'no-eval': 'warn',
    'max-len': [
      'error',
      {
        code: 130,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreUrls: true,
      },
    ],
    'class-methods-use-this': 'warn',
    'no-continue': 'warn',
    'no-await-in-loop': 'off',
    'no-plusplus': 'off',
    'object-shorthand': ['error', 'never'],
    'no-return-await': 'off',
    '@typescript-eslint/return-await': ['error', 'in-try-catch'],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message:
          'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message:
          '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    '@typescript-eslint/no-floating-promises': 'error',
    'require-await': 'error',
    'no-void': 'off',
  },
};
