module.exports = {
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['build', '*.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:import/errors',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        project: `${__dirname}/tsconfig.json`,
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    // Require all external imports to be declared as a dependency
    'import/no-extraneous-dependencies': ['error'],
    // Imports must not cause cyclical dependencies
    'import/no-cycle': ['error'],
    // Imports must be ordered appropriately
    'import/order': [
      'error',
      {
        pathGroups: [
          {
            pattern: '@*/**',
            group: 'parent',
          },
        ],
      },
    ],
    // Imports must be placed before non-import statements
    'import/first': 'error',
    'no-console': 'error',

    'arrow-body-style': ['error', 'as-needed'],
    'no-underscore-dangle': 'off',
    'spaced-comment': [
      'error',
      'always',
      {
        markers: ['/'],
      },
    ],
    '@typescript-eslint/consistent-type-imports': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
