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

- [x] **100% офлайн-работа:** Плагин `vite-plugin-pwa` генерирует `dist/sw.js` и кэширует 100% статических ресурсов и шрифтов. Приложение полностью функционально офлайн.
- [x] **Корректный Manifest:** Сгенерирован валидный `manifest.webmanifest` с параметрами `display: standalone`, `theme_color: #08090d`, `background_color: #08090d`.
- [x] **Standalone режим:** Поддерживается открытие на полный экран без рамок браузера как на Android, так и на iOS Safari.
- [x] **Корректный Theme Color:** Статус-бар мобильного устройства окрашивается в тон фона приложения `#08090d`.
- [x] **Обновление версий:** Режим `registerType: 'autoUpdate'` автоматически подтягивает свежие версии ассетов при выходе обновлений.
- [x] **Индикатор установки (InstallBanner):** Реализован компонент перехвата события установки и инструкции для пользователей iOS.

---

## 6. Принятые технические решения (ADR)
1. **PWA-генератор:** Использован `vite-plugin-pwa` в режиме `generateSW` с прекэшированием ассетов и Runtime Cache для шрифтов Google Fonts (`CacheFirst` на 365 дней).
2. **Векторная неоновая иконка:** Создан масштабируемый SVG `public/icon.svg` с неоновым символом штанги и молнии.
3. **Умный InstallBanner:** Показывается только в веб-режиме, не показывается в Standalone и запоминает скрытие на 7 дней в `localStorage`.

---

## 5. Проверка работоспособности (No-Regression Check)
1. Выполнить сборку `npm run build` и локальный превью `npm run preview`.
2. В Chrome DevTools перейти в вкладку Network -> выбрать «Offline».
3. Перезагрузить страницу (Cmd+R) — приложение должно мгновенно загрузиться из Service Worker Cache.
4. Проверить аудит Lighthouse в категории «Progressive Web App» (все чеки зеленые).
