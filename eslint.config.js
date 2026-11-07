import security from 'eslint-plugin-security';

export default [
    {
        ignores: ['node_modules/', 'dist/', 'client/'],
    },
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                global: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                fetch: 'readonly',
                AbortController: 'readonly',
                AbortSignal: 'readonly',
                TextEncoder: 'readonly',
                TextDecoder: 'readonly',
                setImmediate: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
            },
        },
        plugins: {
            security,
        },
        rules: {
            // Critical Runtime Protection
            'no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            'no-duplicate-case': 'error',
            'no-unreachable': 'error',
            'no-const-assign': 'error',

            // Best practices
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off',
            'prefer-const': 'warn',
            'no-var': 'error',

            // Security
            'security/detect-object-injection': 'warn',
            'security/detect-non-literal-regexp': 'warn',
            'security/detect-unsafe-regex': 'error',

            // Code style
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
        },
    },
];
