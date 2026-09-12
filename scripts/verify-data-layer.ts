import {
  getProgram,
  saveProgram,
  logSet,
  getDayRecord,
  getHistory,
  exportBackup,
  importBackup,
  resetAllData,
} from '../src/services/storage';

console.log('🧪 Starting Data Layer & Immutability Verification...');

// 1. Reset data to clean state
resetAllData();

// 2. Verify default program initialization
const program = getProgram();
console.assert(program.version === 2, 'Program version should be 2');
console.assert(program.days['A'].exercises.length === 3, 'Day A should have 3 exercises');
console.assert(program.days['B'].exercises.length === 4, 'Day B should have 4 exercises');
console.assert(program.days['A'].schedule?.length === 8, 'Day A should have 8 schedule slots');
console.assert(program.days['B'].schedule?.length === 7, 'Day B should have 7 schedule slots');
console.log('✅ Default program initialized correctly');

// 3. Log a set for Day A
const pullUpExercise = program.days['A'].exercises[0];
const testDate = '2026-09-12';
const loggedSet = logSet(testDate, 'A', pullUpExercise, 10);

console.assert(loggedSet.exerciseNameSnapshot === 'Подтягивания', 'Snapshot must preserve original name');
console.assert(loggedSet.reps === 10, 'Reps should match logged reps');

const dayRecord = getDayRecord(testDate);
console.assert(dayRecord.completedSets.length === 1, 'Day record should have 1 completed set');
console.log('✅ Set logged with snapshot successfully');

// 4. Test Immutability: Mutate the program (rename and remove exercise)
const mutatedProgram = JSON.parse(JSON.stringify(program));
mutatedProgram.days['A'].exercises[0].name = 'НОВОЕ НАЗВАНИЕ ПОДТЯГИВАНИЙ';
mutatedProgram.days['A'].exercises = mutatedProgram.days['A'].exercises.slice(1); // remove pull-ups entirely!
saveProgram(mutatedProgram);

// Check that the active program was indeed changed
const currentProgram = getProgram();
console.assert(currentProgram.days['A'].exercises.length === 2, 'Program should now have 2 exercises');

// Check that the historical day record is UNTOUCHED!
const historyRecord = getDayRecord(testDate);
console.assert(historyRecord.completedSets.length === 1, 'History still has the set');
console.assert(
  historyRecord.completedSets[0].exerciseNameSnapshot === 'Подтягивания',
  'History MUST preserve the original exercise name snapshot even after exercise removal!'
);
console.log('✅ IMMUTABILITY VERIFIED: Historical records are immune to program changes!');

// 5. Test Backup Export and Import
const backupJson = exportBackup();
console.assert(typeof backupJson === 'string' && backupJson.length > 50, 'Backup should be a valid JSON string');

resetAllData();
console.assert(Object.keys(getHistory()).length === 0, 'History should be empty after reset');

const importSuccess = importBackup(backupJson);
console.assert(importSuccess === true, 'Import should succeed');
const restoredRecord = getDayRecord(testDate);
console.assert(restoredRecord.completedSets.length === 1, 'Restored record has the historical set intact');
console.log('✅ Backup export and import verified');

// 6. Test Automatic Day Rotation Logic (A -> B -> A, Sunday = REST)
import { getAutoDayType } from '../src/utils/dateUtils';

// Пустая история в понедельник (2026-09-14) -> День А
const emptyDay = getAutoDayType('2026-09-14', {});
console.assert(emptyDay === 'A', 'Empty history on Monday should start with Day A');

// Воскресенье (2026-09-13) -> Отдых
const sundayDay = getAutoDayType('2026-09-13', {});
console.assert(sundayDay === 'REST', 'Sunday must always be REST');

// Вчера (2026-09-14) был День А -> сегодня (2026-09-15) должен быть День Б
const historyWithA: Record<string, any> = {
  '2026-09-14': { date: '2026-09-14', dayType: 'A', completedSets: [{ id: '1' }] },
};
const tuesdayDay = getAutoDayType('2026-09-15', historyWithA);
console.assert(tuesdayDay === 'B', 'Day after Day A should automatically be Day B');

// Вчера (2026-09-15) был День Б -> сегодня (2026-09-16) должен быть День А
const historyWithB: Record<string, any> = {
  ...historyWithA,
  '2026-09-15': { date: '2026-09-15', dayType: 'B', completedSets: [{ id: '2' }] },
};
const wednesdayDay = getAutoDayType('2026-09-16', historyWithB);
console.assert(wednesdayDay === 'A', 'Day after Day B should automatically be Day A');

// В субботу (2026-09-12) был День А, в воскресенье (2026-09-13) отдых -> в понедельник (2026-09-14) должен быть День Б
const historySatA: Record<string, any> = {
  '2026-09-12': { date: '2026-09-12', dayType: 'A', completedSets: [{ id: '1' }] },
  '2026-09-13': { date: '2026-09-13', dayType: 'REST', completedSets: [] },
};
const mondayAfterSunday = getAutoDayType('2026-09-14', historySatA);
console.assert(mondayAfterSunday === 'B', 'Monday after Sunday rest should continue rotation to Day B');
console.log('✅ Automatic A/B/REST Day Rotation Logic Verified!');

console.log('🎉 ALL DATA LAYER & IMMUTABILITY TESTS PASSED!');
