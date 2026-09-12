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

- [ ] **Автоматический деплой:** При пуше в `main` пайплайн GitHub Actions собирает проект и успешно публикует его на GitHub Pages без ручных действий.
- [ ] **Доступность продакшена:** Страница приложения на GitHub Pages открывается по публичному URL, все ассеты (скрипты, стили, шейдеры, иконки) подгружаются с HTTP 200.
- [ ] **Отсутствие ошибок в консоли:** В консоли браузера на опубликованном сайте нет ошибок 404, CORS или ошибок инициализации WebGL.
- [ ] **PWA на GitHub Pages:** При открытии сайта с мобильного телефона в Safari / Chrome доступна кнопка добавления на экран «Домой», и офлайн-режим работает после установки.
- [ ] **Lighthouse рейтинг:** Показатели производительности и PWA в зеленой зоне (90+ баллов).

---

## 5. Проверка работоспособности (No-Regression Check)
1. Выполнить команду `npm run build` локально.
2. Запустить `npm run preview` и проверить работу всех вкладок приложения.
3. Проверить синтаксис файла `.github/workflows/deploy.yml`.
