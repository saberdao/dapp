// eslint-disable-next-line no-undef
module.exports = {
    'env': {
        'browser': true,
        'es6': true,
    },
    'extends': [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
    ],
    'globals': {
        'Atomics': 'readonly',
        'SharedArrayBuffer': 'readonly',
    },
    'parser': '@typescript-eslint/parser',
    'parserOptions': {
        'ecmaFeatures': {
            'jsx': true,
        },
        'ecmaVersion': 2018,
        'sourceType': 'module',
    },
    'plugins': [
        'react',
        '@typescript-eslint',
    ],
    'rules': {
        'indent': [
            'error',
            4,
        ],
        'linebreak-style': [
            'error',
            'unix',
        ],
        'quotes': [
            'error',
            'single',
        ],
        'semi': [
            'error',
            'always',
        ],
        'comma-dangle': ['error', 'always-multiline'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
    },
};