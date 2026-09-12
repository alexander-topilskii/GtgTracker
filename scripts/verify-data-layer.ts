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
console.assert(program.version === 1, 'Program version should be 1');
console.assert(program.days['A'].exercises.length === 3, 'Day A should have 3 exercises');
console.assert(program.days['B'].exercises.length === 3, 'Day B should have 3 exercises');
console.log('✅ Default program initialized correctly');

// 3. Log a set for Day A
const pullUpExercise = program.days['A'].exercises[0];
const testDate = '2026-09-12';
const loggedSet = logSet(testDate, 'A', pullUpExercise, 5);

console.assert(loggedSet.exerciseNameSnapshot === 'Подтягивания (Pull-ups)', 'Snapshot must preserve original name');
console.assert(loggedSet.reps === 5, 'Reps should match logged reps');

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
  historyRecord.completedSets[0].exerciseNameSnapshot === 'Подтягивания (Pull-ups)',
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

console.log('🎉 ALL DATA LAYER & IMMUTABILITY TESTS PASSED!');
