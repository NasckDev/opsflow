// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default defineConfig([
  {
    ignores: [
      'dist/**',
      '.angular/**',
      'coverage/**',
      'dist-portable/**',
      'storybook-static/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
    },
  },
  {
    // Proteção do padrão de UI: bibliotecas visuais só entram por src/app/ui (wrappers).
    files: ['src/**/*.ts'],
    ignores: ['src/app/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'ng-zorro-antd',
                'ng-zorro-antd/*',
                'echarts',
                'echarts/*',
                'ngx-echarts',
                '@ant-design/icons-angular',
                '@ant-design/icons-angular/*',
              ],
              message:
                'Use os wrappers de src/app/ui (app-button, app-table, app-chart...). Importe NG-ZORRO, ECharts e ícones só dentro de src/app/ui.',
            },
          ],
        },
      ],
    },
  },
  {
    // Nos wrappers, `li[nz-menu-item]` e `label[nz-checkbox]` já tratam teclado e foco (NG-ZORRO).
    files: ['src/app/ui/**/*.html', 'src/app/ui/**/*.ts/*.html'],
    rules: {
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
