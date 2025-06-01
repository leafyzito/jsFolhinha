import eslint from '@eslint/js';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

let eslint_config_default = [
    eslint.configs.recommended,
    prettierConfig,
    {
        files: ['**/*.js'],
        plugins: {
            prettier: prettierPlugin,
        },
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // Node.js globals
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                console: 'readonly',
                // Web APIs available in Node.js
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                Buffer: 'readonly',
                // Other common globals
                exports: 'readonly',
            },
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'require-await': 'error',
            'no-var': 'error',
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    semi: true,
                    tabWidth: 4,
                    trailingComma: 'es5',
                    printWidth: 100,
                    bracketSpacing: true,
                    arrowParens: 'avoid',
                },
            ],
        },
        ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
    },
];
export { eslint_config_default as default };
