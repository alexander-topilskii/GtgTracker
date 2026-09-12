# Этап 08: Поддержка PWA, офлайн-режим и установка (PWA Offline & Installation)

## 1. Цель этапа
Превратить веб-приложение в полноценное прогрессивное веб-приложение (PWA), способное работать на 100% автономно без подключения к интернету, поддерживающее установку на домашний экран смартфонов iOS и Android в режиме Standalone (без адресной строки браузера) и обеспечивающее нативный мобильный опыт.

---

## 2. Детальный состав работ

### 2.1. Конфигурация PWA и Service Worker
- Подключение плагина `vite-plugin-pwa`:
  - Стратегия кэширования `generateSW` или `injectManifest`.
  - Прекэширование всех критических статических ассетов (HTML, JS, CSS, шрифты, SVG, шейдерные скрипты).
  - Настройка Runtime Caching для шрифтов Google Fonts (`CacheFirst`).

### 2.2. Манифест приложения (`manifest.webmanifest`)
- Конфигурация манифеста:
  - `name`: «GtG Tracker — Grease the Groove»
  - `short_name`: «GtG Tracker»
  - `start_url`: `./`
  - `display`: `standalone`
  - `background_color`: `#08090d`
  - `theme_color`: `#08090d`
  - `orientation`: `portrait`
  - Иконки: наборы 192x192, 512x512 и maskable-иконка для Android с неоновым символом.

### 2.3. Мета-теги для iOS Safari (Standalone Experience)
- Добавление в `index.html`:
  - `<meta name="apple-mobile-web-app-capable" content="yes">`
  - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
  - `<meta name="apple-mobile-web-app-title" content="GtG Tracker">`
  - Ссылки на `apple-touch-icon.png`.

### 2.4. Индикатор установки и обновления (PWA Prompts)
- Компонент `src/components/pwa/InstallPrompt.tsx`:
  - Перехват события `beforeinstallprompt` для Android/Chrome с красивой ненавязчивой кнопкой «Установить приложение».
  - Подсказка для iOS Safari («Нажмите Поделиться -> На экран Домой»).
  - Уведомление о наличии новой версии приложения с кнопкой «Обновить».

---

## 3. Архитектура и структура файлов
```
├── vite.config.ts (с настройкой vite-plugin-pwa)
├── index.html
├── public/
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── apple-touch-icon.png
└── src/
    └── components/
        └── pwa/
            ├── InstallPrompt.tsx
            └── ReloadPrompt.tsx
```

---

## 4. Критерии приемки (Acceptance Criteria)

- [ ] **100% офлайн-работа:** При отключении интернета (режим Offline в Network DevTools) приложение открывается, полностью функционирует, отображает данные и позволяет фиксировать подходы.
- [ ] **Корректный Manifest:** Вкладка Application -> Manifest в Chrome DevTools не содержит ошибок и предупреждений.
- [ ] **Standalone режим:** При запуске с домашнего экрана приложение открывается на полный экран без адресной строки и панелей навигации браузера.
- [ ] **Корректный Theme Color:** Цвет статус-бара совпадает с темным фоном приложения (`#08090d`).
- [ ] **Обновление версий:** При деплое новой версии Service Worker предлагает обновить страницу без зависания старого кэша.

---

## 5. Проверка работоспособности (No-Regression Check)
1. Выполнить сборку `npm run build` и локальный превью `npm run preview`.
2. В Chrome DevTools перейти в вкладку Network -> выбрать «Offline».
3. Перезагрузить страницу (Cmd+R) — приложение должно мгновенно загрузиться из Service Worker Cache.
4. Проверить аудит Lighthouse в категории «Progressive Web App» (все чеки зеленые).
