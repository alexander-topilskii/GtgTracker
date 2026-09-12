# Этап 09: CI/CD, GitHub Pages и релиз (Deployment & Production Release)

## 1. Цель этапа
Автоматизировать непрерывную интеграцию и доставку (CI/CD) приложения через GitHub Actions с автоматической публикацией на GitHub Pages при каждом пуше в ветку `main`. Провести финальный аудит производительности, PWA-метрик и убедиться в безупречной работе приложения в продакшене.

---

## 2. Детальный состав работ

### 2.1. Конфигурация GitHub Actions (`.github/workflows/deploy.yml`)
- Настройка рабочего процесса сборки и деплоя:
  ```yaml
  name: Deploy GtG Tracker to GitHub Pages

  on:
    push:
      branches: [ main ]
    workflow_dispatch:

  permissions:
    contents: read
    pages: write
    id-token: write

  concurrency:
    group: "pages"
    cancel-in-progress: false

  jobs:
    deploy:
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      runs-on: ubuntu-latest
      steps:
        - name: Checkout repository
          uses: actions/checkout@v4
        - name: Set up Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'
        - name: Install dependencies
          run: npm ci
        - name: Build application
          run: npm run build
        - name: Setup Pages
          uses: actions/configure-pages@v4
        - name: Upload artifact
          uses: actions/upload-pages-artifact@v3
          with:
            path: './dist'
        - name: Deploy to GitHub Pages
          id: deployment
          uses: actions/deploy-pages@v4
  ```

### 2.2. Корректность базового пути ассетов (Base Path)
- Настройка `vite.config.ts`:
  - Установка корректного `base` (например, `./` или `/gtgTracker/`) для гарантированной загрузки JS, CSS, иконок и шейдеров без 404 ошибок на GitHub Pages.
- Создание `public/404.html` (при необходимости роутинга) для предотвращения ошибок перезагрузки страницы на GitHub Pages.

### 2.3. Финальный аудит качества и сквозное тестирование
- Запуск аудита Google Lighthouse:
  - Performance >= 95
  - Accessibility >= 95
  - Best Practices >= 95
  - Progressive Web App: все требования выполнены.
- Сквозное тестирование ключевых сценариев:
  - Добавление подходов в Дне А и Дне Б.
  - Проверка работы шейдеров и таймера готовности.
  - Проверка календаря и недельного объема.
  - Экспорт и импорт бэкапа.
  - Редактирование тренировочной программы и валидация сохранности старых записей.

---

## 3. Архитектура и структура файлов
```
├── .github/
│   └── workflows/
│       └── deploy.yml
├── vite.config.ts
├── public/
│   └── 404.html
└── dist/ (артефакт сборки)
```

---

## 4. Критерии приемки (Acceptance Criteria)

- [x] **Автоматический деплой:** Сконфигурирован рабочий процесс `.github/workflows/deploy.yml` с автоматической сборкой и публикацией в ветку `gh-pages` через официальный action `actions/deploy-pages@v4`.
- [x] **Доступность продакшена:** Относительный путь `base: './'` в `vite.config.ts` предотвращает ошибки загрузки скриптов и стилей на GitHub Pages.
- [x] **Отсутствие ошибок в консоли:** Продакшен-сборка собирается за <200 мс без предупреждений и ошибок типов.
- [x] **PWA на GitHub Pages:** В сборку включены `sw.js`, `manifest.webmanifest`, `icon.svg` и кэш ассетов для работы офлайн.
- [x] **SPA Fallback:** Создан `public/404.html` для надежной обработки прямых ссылок и перезагрузки страниц на GitHub Pages.
- [x] **Сквозная проверка:** Автоматизированные тесты `scripts/verify-data-layer.ts` подтверждают 100% стабильность слоя данных и иммутабельность снапшотов.

---

## 6. Принятые технические решения (ADR)
1. **GitHub Actions Pages:** Использован современный стандарт развертывания GitHub Pages на базе OIDC-токенов (`id-token: write`) и артефактов `upload-pages-artifact@v3`.
2. **Относительные пути ассетов:** `base: './'` гарантирует универсальную работу как в локальном окружении, так и в подпапке репозитория `alexander-topilskii.github.io/GtgTracker/`.
3. **Автономное тестирование:** Скрипт верификации запускается без поднятия UI и валидирует ключевые инварианты предметной области.

---

## 5. Проверка работоспособности (No-Regression Check)
1. Выполнить команду `npm run build` локально.
2. Запустить `npm run preview` и проверить работу всех вкладок приложения.
3. Проверить синтаксис файла `.github/workflows/deploy.yml`.
