import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'app',
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  formatters: true,
  stylistic: {
    indent: 2,
    semi: false,
    quotes: 'single',
  },
  ignores: ['src/data/migrations/**'],
  rules: {
    'antfu/no-top-level-await': ['off'],
    'antfu/top-level-function': ['off'],
    'complexity': ['warn', 15],
    'curly': ['error', 'all'],
    'ts/strict-boolean-expressions': ['off'],
    'func-style': ['error', 'expression', { allowArrowFunctions: true }],
    'no-console': ['warn'],
    'no-return-await': ['error'],
    'node/no-process-env': ['error'],
    'node/prefer-global/process': ['off'],
    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'return' },
    ],
    'perfectionist/sort-imports': ['error', {
      internalPattern: ['^@/'],
    }],
    'prefer-arrow-callback': ['error'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'ts/no-unsafe-argument': ['off'],
    'ts/no-unsafe-assignment': ['off'],
    'ts/no-unsafe-call': ['off'],
    'ts/no-unsafe-member-access': ['off'],
    'ts/no-unsafe-return': ['off'],
    'unicorn/filename-case': ['error', {
      case: 'kebabCase',
      ignore: ['README.md', 'CLAUDE.md', 'WARP.md'],
    }],
  },
})
