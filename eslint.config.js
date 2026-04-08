import pluginVue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  // Global configuration
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    ignores: ['node_modules/', 'dist/'],
  },
  
  // Standard Recommended rules
  ...pluginVue.configs['flat/recommended'],
  
  // Custom project rules
  {
    files: ['src/**/*.{js,vue}'],
    plugins: {
      vue: pluginVue,
      prettier: pluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'prettier/prettier': [
        'error',
        {
          semi: false,
          singleQuote: true,
        },
      ],
      ...prettier.rules, // Disable ESLint rules that might conflict with Prettier
    },
  },
]
