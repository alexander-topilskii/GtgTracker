# План разработки проекта «GtG Tracker» (PWA)

Данный план описывает поэтапную реализацию проекта **GtG Tracker** по методологии инкрементального MVP. Каждый этап добавляет самостоятельную функциональную ценность, сохраняя приложение в полностью работоспособном, собираемом и тестируемом состоянии на каждом шаге (`npm run dev` и `npm run build` всегда зеленые).

---

## Сводная таблица этапов работ

| № | Этап | Ключевая цель / Результат | Детальная спецификация | Статус |
|---|------|---------------------------|------------------------|:------:|
| **01** | **Scaffolding & Core Architecture** | Инициализация Vite + React + TS + Tailwind, базовый лейаут в темной эстетике, рабочая сборка без ошибок. | [01_project_scaffolding.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/01_project_scaffolding.md) | ⏳ План |
| **02** | **Data Layer & Immutability** | Local-first хранилище, JSON-схема тренировочной программы (`program.json`), изоляция истории от изменений плана через снапшоты. | [02_data_layer_and_models.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/02_data_layer_and_models.md) | ⏳ План |
| **03** | **Core Dashboard & Set Logging** | Главный экран без скролла (100dvh): переключатель дней, карточки упражнений, быстрая фиксация `+1 подход` с тактильным откликом. | [03_core_dashboard.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/03_core_dashboard.md) | ⏳ План |
| **04** | **Rest Timer & Muscle Readiness** | Таймер времени с последнего подхода с переходом в статус готовности (>45–60 мин) и визуальным изменением состояний. | [04_rest_timer.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/04_rest_timer.md) | ⏳ План |
| **05** | **Shaders & Micro-Animations** | WebGL/Canvas шейдер фоновой ауры (Ambient Noise Aura), радиальное свечение таймера, ripple-эффект нажатий, пружинные анимации и частицы. | [05_shaders_and_animations.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/05_shaders_and_animations.md) | ⏳ План |
| **06** | **History & Volume Analytics** | Минималистичный календарь выполненных тренировок, проверка сохранности старых записей, трекер суммарного объема (7/30 дней). | [06_history_and_analytics.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/06_history_and_analytics.md) | ⏳ План |
| **07** | **Settings & Program Editor** | Экран настроек: редактирование и импорт/экспорт `program.json` без порчи истории, настройка таймеров, полный бэкап данных. | [07_settings_and_program_editor.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/07_settings_and_program_editor.md) | ⏳ План |
| **08** | **PWA Offline & Installation** | Манифест, Service Worker, кэширование ассетов для 100% офлайн-работы и установка на домашний экран (standalone). | [08_pwa_and_offline.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/08_pwa_and_offline.md) | ⏳ План |
| **09** | **CI/CD & GitHub Pages Release** | Автоматизация сборки через GitHub Actions, корректные base path, проверка Lighthouse и финальный релиз. | [09_deployment_and_release.md](file:///Users/aleksandrtopilskii/Documents/projects/gtgTracker/plan/09_deployment_and_release.md) | ⏳ План |

---

## Принципы разработки (MVP Lifecycle)

1. **Непрерывная работоспособность (Zero Broken States):**
   Каждый коммит и шаг оставляет приложение в работоспособном состоянии. Не допускаются промежуточные коммиты с некомпилирующимся кодом или сломанным интерфейсом.
2. **Local-First & Privacy:**
   Все данные живут у пользователя в браузере. Никаких внешних бэкендов и авторизаций для базового использования.
3. **Иммутабельность истории:**
   Любое изменение или удаление упражнений в программе тренировок не должно модифицировать ранее зафиксированные дни.
4. **Кибер-минимализм и производительность:**
   Шейдеры и анимации должны быть энергоэффективными, работать со скоростью 60 FPS на мобильных устройствах и останавливаться при неактивной вкладке.
