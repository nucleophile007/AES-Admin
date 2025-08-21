module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Allow any type in generated files and specific cases
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-expressions': 'warn',
    '@typescript-eslint/no-this-alias': 'error',
    '@typescript-eslint/no-require-imports': 'error',
    // React specific
    'react/no-unescaped-entities': 'error',
  },
  overrides: [
    // Disable strict rules for generated Prisma files
    {
      files: [
        'src/generated/**/*',
        'prisma/**/*',
        '**/*.js',
        '**/*.d.ts'
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off', 
        '@typescript-eslint/no-unused-expressions': 'off',
        '@typescript-eslint/no-this-alias': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        '@typescript-eslint/no-wrapper-object-types': 'off',
        '@typescript-eslint/no-unnecessary-type-constraint': 'off',
        '@typescript-eslint/no-unsafe-function-type': 'off',
      },
    },
    // Allow relaxed rules for test files
    {
      files: ['**/__tests__/**/*', '**/*.test.{js,ts,tsx}', '**/*.spec.{js,ts,tsx}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
}
