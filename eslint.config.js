import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        module: 'readonly',
        exports: 'writable',
        fetch: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        URL: 'readonly'
      }
    },
    ignores: ['node_modules/**', 'src/app/extensions/**']
  }
];
