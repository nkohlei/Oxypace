import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
    { ignores: ['dist', 'dist-mobile'] },
    {
        files: ['**/*.{js,jsx}'],
        linterOptions: {
            reportUnusedDisableDirectives: 'off',
        },
        languageOptions: {
            ecmaVersion: 2020,
            globals: {
                ...globals.browser,
                process: 'readonly',
            },
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        settings: { react: { version: '18.3' } },
        plugins: {
            react,
            'react-hooks': reactHooks,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...react.configs.recommended.rules,
            'no-undef': 'error',
            'react/jsx-no-undef': 'error',
            'no-dupe-keys': 'error',
            'no-dupe-args': 'error',
            'no-duplicate-case': 'error',
            'no-unreachable': 'error',
            'no-const-assign': 'error',
            'react-hooks/rules-of-hooks': 'off',
            'react/jsx-no-comment-textnodes': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
            'react/display-name': 'off',
            'react/no-unknown-property': 'off',
            'no-unused-vars': 'off',
            'prefer-const': 'off',
            'no-console': 'off',
            'no-empty': 'off',
            'no-useless-assignment': 'off',
            'no-async-promise-executor': 'off',
            'preserve-caught-error': 'off',
            'react-hooks/exhaustive-deps': 'off',
        },
    },
];
