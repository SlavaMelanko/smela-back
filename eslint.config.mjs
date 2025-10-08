import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    semi: false,
    quotes: 'single',
  },
  ignores: ['src/data/migrations/**'],
  rules: {
    'complexity': ['warn', 15],
    'no-console': ['warn'],
    'antfu/no-top-level-await': ['off'],
    'node/prefer-global/process': ['off'],
    'node/no-process-env': ['error'],
    'perfectionist/sort-imports': ['error', {
      internalPattern: ['^@/'],
    }],
    'unicorn/filename-case': ['error', {
      case: 'kebabCase',
      ignore: ['README.md', 'CLAUDE.md', 'WARP.md'],
    }],
    'prefer-arrow-callback': ['error'],
    'antfu/top-level-function': ['off'],
    'func-style': ['error', 'expression', { allowArrowFunctions: true }],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'curly': ['error', 'all'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
    'no-return-await': ['error'],
    '@typescript-eslint/no-unsafe-assignment': ['off'],
    '@typescript-eslint/no-unsafe-call': ['off'],
    '@typescript-eslint/no-unsafe-member-access': ['off'],
    '@typescript-eslint/no-unsafe-return': ['off'],
    '@typescript-eslint/no-unsafe-argument': ['off'],
  },
})
