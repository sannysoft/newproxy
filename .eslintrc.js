module.exports = {
  plugins: ['@typescript-eslint', 'eslint-comments', 'jest', 'promise', 'unicorn'],
  extends: [
    'airbnb-typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    'plugin:jest/recommended',
    'plugin:promise/recommended',
    'plugin:unicorn/recommended',
    'prettier',
    'prettier/react',
    'prettier/@typescript-eslint',
  ],
  env: {
    node: true,
    browser: false,
    jest: true,
  },
  rules: {
    'import/prefer-default-export': 'off',
    'react/destructuring-assignment': 'off',

    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    // Makes no sense to allow type inferrence for expression parameters, but require typing the response
    '@typescript-eslint/explicit-function-return-type': [
      'error',
      { allowExpressions: true, allowTypedFunctionExpressions: true },
    ],
    '@typescript-eslint/no-use-before-define': [
      'error',
      { functions: false, classes: true, variables: true, typedefs: true },
    ],
    // Common abbreviations are known and readable
    'unicorn/prevent-abbreviations': 'off',

    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',

    'import/no-default-export': 'off',
    'prefer-destructuring': 'off',
    'object-shorthand': 'off',
    'no-plusplus': 'off',
    'dot-notation': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
