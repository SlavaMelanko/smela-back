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
  ignores: ['src/data/migrations/**', 'scripts/**', '**/*.md', 'coverage/**', '.env*'],
  rules: {
    'antfu/top-level-function': ['off'],
    'complexity': ['warn', 10],
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
    'style/max-len': ['error', {
      code: 100,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
    }],
    'ts/member-ordering': ['error', {
      default: [
        // Static fields
        'public-static-field',
        'protected-static-field',
        'private-static-field',
        // Instance fields
        'public-instance-field',
        'protected-instance-field',
        'private-instance-field',
        // Constructor
        'constructor',
        // Static methods
        'public-static-method',
        'protected-static-method',
        'private-static-method',
        // Instance methods
        'public-instance-method',
        'protected-instance-method',
        'private-instance-method',
      ],
    }],
    'ts/no-unsafe-argument': ['error'],
    'ts/no-unsafe-assignment': ['error'],
    'ts/no-unsafe-call': ['error'],
    'ts/no-unsafe-member-access': ['error'],
    'unicorn/filename-case': ['error', {
      case: 'kebabCase',
      ignore: ['README.md', 'CLAUDE.md', 'WARP.md'],
    }],
  },
}, {
  files: ['**/*.test.ts', '**/__tests__/**'],
  rules: {
    'ts/no-unsafe-argument': ['off'],
    'ts/no-unsafe-assignment': ['off'],
    'ts/no-unsafe-call': ['off'],
    'ts/no-unsafe-member-access': ['off'],
  },
})
