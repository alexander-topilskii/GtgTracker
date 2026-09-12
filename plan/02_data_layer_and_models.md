# Этап 02: Слой данных, JSON-программа и иммутабельность истории (Data Layer & Models)

## 1. Цель этапа
Спроектировать и реализовать архитектуру данных local-first: строго типизированную JSON-программу тренировок, хранилище `localStorage` с версионированием, а также механизм снапшотов для обеспечения 100% иммутабельности исторических записей при любых будущих изменениях программы.

---

## 2. Детальный состав работ

### 2.1. TypeScript-модели и схемы данных
- Создание файла `src/types/workout.ts`:
  - Описание типов `DayType` (`'A' | 'B' | 'REST' | string`).
  - Описание интерфейсов:
    - `ExerciseConfig`: id, name, targetSets, defaultReps, weight, notes.
    - `DayPlanConfig`: dayType, title, exercises.
    - `WorkoutProgramConfig`: version, name, defaultRestIntervalMinutes, days.
    - `ExerciseLogItem`: id, exerciseId, exerciseNameSnapshot, targetRepsSnapshot, timestamp, reps, weight.
    - `DayRecord`: date (`YYYY-MM-DD`), dayType, completedSets, programVersionSnapshot, notes.
    - `AppSettings`: restIntervalMinutes, hapticFeedbackEnabled, theme.

### 2.2. Дефолтная программа тренировок (`defaultProgram.json`)
- Создание `src/data/defaultProgram.json`:
  - **День А:** Подтягивания (Pull-ups: 5 подходов, 5 повторений), Отжимания на брусьях (Dips: 5 подходов, 8 повторений), Подъем ног к перекладине (Hanging Leg Raises: 4 подхода, 8 повторений).
  - **День Б:** Подъем гантелей на бицепс (Bicep Curls: 4 подхода, 10 повторений), Махи с гантелями (Lateral Raises: 4 подхода, 12 повторений), Приседания (Squats / Bulgarian: 5 подходов, 15 повторений).
  - **Отдых:** Статус паузы.

### 2.3. Сервис хранилища и принцип иммутабельности (Storage Service)
- Создание `src/services/storage.ts`:
  - Чтение и запись в `localStorage` с безопасным парсингом и валидацией данных.
  - Ключи: `gtg_program_v1`, `gtg_history_v1`, `gtg_settings_v1`.
  - При первой загрузке: автоматическая инициализация из `defaultProgram.json`.
  - Метод добавления подхода `logSet(dayDate, exerciseConfig, reps, weight)`:
    - **Обязательно сохраняет `exerciseNameSnapshot: exerciseConfig.name`** и целевые параметры на момент выполнения.
  - Метод получения истории `getDayRecord(date)` и `getHistory()`:
    - Возвращает исторические записи без зависимости от того, присутствует ли данное упражнение в текущей активной программе.

### 2.4. React Context / Custom Hooks
- Реализация хуков:
  - `useWorkoutProgram()` — доступ к текущей активной программе и методам её обновления.
  - `useDayLog(date: string)` — реактивный доступ к записям выбранного дня, добавление и удаление подходов.
  - `useSettings()` — параметры приложения (интервал отдыха, виброотклик).

---

## 3. Архитектура и структура файлов
```
src/
├── types/
│   └── workout.ts
├── data/
│   └── defaultProgram.json
├── services/
│   ├── storage.ts
│   └── __tests__/
│       └── storage.test.ts
└── context/
    ├── WorkoutContext.tsx
    └── SettingsContext.tsx
```

---

## 4. Критерии приемки (Acceptance Criteria)

- [x] **Начальная инициализация:** При первом запуске в чистом браузере автоматически загружается дефолтная программа тренировок День А / День Б из `defaultProgram.json`.
- [x] **Персистентность в localStorage:** Добавленные подходы и изменения настроек сохраняются после перезагрузки страницы (с защитой SafeStorage от приватного режима).
- [x] **Иммутабельность истории (Тест на регрессию пройден):**
  - Подтверждено автоматизированным тестом `scripts/verify-data-layer.ts`: переименование и удаление упражнения из программы не затрагивают снапшоты в исторических днях.
- [x] **Поддержка кастомных программ:** Структура `WorkoutProgramConfig` готова к приему произвольных конфигураций через JSON-редактор и импорт.
- [x] **Чистая сборка:** `npm run build` успешно компилирует проект.

---

## 6. Принятые технические решения (ADR)
1. **Паттерн Snapshotting:** Каждая запись о выполненном сете (`ExerciseLogItem`) сохраняет фиксированные поля `exerciseNameSnapshot` и `targetRepsSnapshot`. Это гарантирует 100% изоляцию истории от любых будущих правок программы.
2. **SafeStorage:** Обертка над `localStorage` с отказоустойчивым `in-memory fallback`, предотвращающая падение приложения в Safari в режиме Private Browsing.
3. **Единый источник истины:** Реализован `WorkoutContext` с реактивным распространением изменений состояния (программа, история, активный день, настройки).
4. **Сквозная валидация:** Добавлен проверочный скрипт `scripts/verify-data-layer.ts` для непрерывного контроля иммутабельности и бэкапов.

---

## 5. Проверка работоспособности (No-Regression Check)
1. Написать или выполнить unit/интеграционный сценарий в браузере:
   - Вызов `storage.logSet(...)` -> проверка ключа в `localStorage`.
   - Изменение `program` в `localStorage` -> проверка, что `getDayRecord(...)` возвращает исходный снапшот.
2. Проверить, что приложение по-прежнему отображает каркас без сбоев.
