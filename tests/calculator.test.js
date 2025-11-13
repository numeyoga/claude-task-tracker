'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { TimeCalculator, DayStatus } from '../js/calculator.js';
import { TimeEntry, ENTRY_TYPES } from '../js/time-entry.js';

const runner = new TestRunner();
const calculator = new TimeCalculator();

// ======================
// Tests de calcul du temps de présence
// ======================

runner.test('Calcule correctement le temps pour une journée complète', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:30:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:30:00')),
        new TimeEntry(ENTRY_TYPES.CLOCK_OUT, new Date('2025-11-13T18:00:00'))
    ];

    const duration = calculator.calculatePresenceTime(entries);
    const hours = duration / (1000 * 60 * 60);

    // Matin: 12:30 - 09:00 = 3.5h
    // Après-midi: 18:00 - 13:30 = 4.5h
    // Total: 8h
    Assert.equal(hours, 8);
});

runner.test('Retourne 0 pour une liste vide', () => {
    const duration = calculator.calculatePresenceTime([]);
    Assert.equal(duration, 0);
});

runner.test('Calcule le temps du matin en cours', () => {
    const clockIn = new Date('2025-11-13T09:00:00');
    const now = new Date('2025-11-13T10:30:00');

    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, clockIn)
    ];

    // Simuler "maintenant" à 10:30
    const originalNow = Date.now;
    Date.now = () => now.getTime();

    const duration = calculator.calculatePresenceTime(entries);
    const hours = duration / (1000 * 60 * 60);

    Date.now = originalNow;

    Assert.equal(hours, 1.5); // 10:30 - 09:00 = 1.5h
});

runner.test('Calcule le temps avec pause en cours', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'))
    ];

    const duration = calculator.calculatePresenceTime(entries);
    const hours = duration / (1000 * 60 * 60);

    Assert.equal(hours, 3); // 12:00 - 09:00 = 3h (pause non comptée)
});

runner.test('Calcule le temps de l\'après-midi en cours', () => {
    const lunchEnd = new Date('2025-11-13T13:00:00');
    const now = new Date('2025-11-13T15:00:00');

    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, lunchEnd)
    ];

    const originalNow = Date.now;
    Date.now = () => now.getTime();

    const duration = calculator.calculatePresenceTime(entries);
    const hours = duration / (1000 * 60 * 60);

    Date.now = originalNow;

    // Matin: 12:00 - 09:00 = 3h
    // Après-midi: 15:00 - 13:00 = 2h
    // Total: 5h
    Assert.equal(hours, 5);
});

// ======================
// Tests de vérification de journée complète
// ======================

runner.test('Détecte une journée complète de 8h', () => {
    const duration = 8 * 60 * 60 * 1000; // 8 heures
    const isComplete = calculator.isWorkDayComplete(duration);
    Assert.isTrue(isComplete);
});

runner.test('Détecte une journée incomplète de 7h', () => {
    const duration = 7 * 60 * 60 * 1000; // 7 heures
    const isComplete = calculator.isWorkDayComplete(duration);
    Assert.isFalse(isComplete);
});

runner.test('Accepte une journée de plus de 8h', () => {
    const duration = 9 * 60 * 60 * 1000; // 9 heures
    const isComplete = calculator.isWorkDayComplete(duration);
    Assert.isTrue(isComplete);
});

// ======================
// Tests de calcul du temps restant
// ======================

runner.test('Calcule correctement le temps restant', () => {
    const duration = 6 * 60 * 60 * 1000; // 6 heures
    const remaining = calculator.getRemainingTime(duration);
    const hours = remaining / (1000 * 60 * 60);

    Assert.equal(hours, 2); // 8h - 6h = 2h restantes
});

runner.test('Retourne 0 si l\'objectif est atteint', () => {
    const duration = 8 * 60 * 60 * 1000; // 8 heures
    const remaining = calculator.getRemainingTime(duration);

    Assert.equal(remaining, 0);
});

runner.test('Retourne 0 si l\'objectif est dépassé', () => {
    const duration = 10 * 60 * 60 * 1000; // 10 heures
    const remaining = calculator.getRemainingTime(duration);

    Assert.equal(remaining, 0);
});

// ======================
// Tests de calcul de la pause déjeuner
// ======================

runner.test('Calcule la durée de la pause terminée', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:00:00'))
    ];

    const duration = calculator.calculateLunchDuration(entries);
    const hours = duration / (1000 * 60 * 60);

    Assert.equal(hours, 1);
});

runner.test('Retourne 0 si aucune pause n\'est commencée', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'))
    ];

    const duration = calculator.calculateLunchDuration(entries);
    Assert.equal(duration, 0);
});

// ======================
// Tests de détermination du statut du jour
// ======================

runner.test('Retourne NOT_STARTED pour aucune entrée', () => {
    const status = calculator.getDayStatus([]);
    Assert.equal(status, DayStatus.NOT_STARTED);
});

runner.test('Retourne MORNING après clock-in', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'))
    ];

    const status = calculator.getDayStatus(entries);
    Assert.equal(status, DayStatus.MORNING);
});

runner.test('Retourne LUNCH après lunch-start', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'))
    ];

    const status = calculator.getDayStatus(entries);
    Assert.equal(status, DayStatus.LUNCH);
});

runner.test('Retourne AFTERNOON après lunch-end', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:00:00'))
    ];

    const status = calculator.getDayStatus(entries);
    Assert.equal(status, DayStatus.AFTERNOON);
});

runner.test('Retourne COMPLETED après clock-out', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:00:00')),
        new TimeEntry(ENTRY_TYPES.CLOCK_OUT, new Date('2025-11-13T18:00:00'))
    ];

    const status = calculator.getDayStatus(entries);
    Assert.equal(status, DayStatus.COMPLETED);
});

// ======================
// Tests de détermination du prochain pointage
// ======================

runner.test('Le premier pointage attendu est clock-in', () => {
    const nextEntry = calculator.getNextExpectedEntry([]);
    Assert.equal(nextEntry, ENTRY_TYPES.CLOCK_IN);
});

runner.test('Après clock-in, lunch-start est attendu', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'))
    ];

    const nextEntry = calculator.getNextExpectedEntry(entries);
    Assert.equal(nextEntry, ENTRY_TYPES.LUNCH_START);
});

runner.test('Après lunch-start, lunch-end est attendu', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'))
    ];

    const nextEntry = calculator.getNextExpectedEntry(entries);
    Assert.equal(nextEntry, ENTRY_TYPES.LUNCH_END);
});

runner.test('Après lunch-end, clock-out est attendu', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:00:00'))
    ];

    const nextEntry = calculator.getNextExpectedEntry(entries);
    Assert.equal(nextEntry, ENTRY_TYPES.CLOCK_OUT);
});

runner.test('Après clock-out, aucun pointage n\'est attendu', () => {
    const entries = [
        new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00')),
        new TimeEntry(ENTRY_TYPES.LUNCH_END, new Date('2025-11-13T13:00:00')),
        new TimeEntry(ENTRY_TYPES.CLOCK_OUT, new Date('2025-11-13T18:00:00'))
    ];

    const nextEntry = calculator.getNextExpectedEntry(entries);
    Assert.isNull(nextEntry);
});

// ======================
// Tests de conversion milliseconds vers heures/minutes
// ======================

runner.test('Convertit correctement les millisecondes en heures et minutes', () => {
    const duration = 5 * 60 * 60 * 1000 + 30 * 60 * 1000; // 5h30
    const result = calculator.msToHoursMinutes(duration);

    Assert.equal(result.hours, 5);
    Assert.equal(result.minutes, 30);
});

runner.test('Gère correctement les heures entières', () => {
    const duration = 8 * 60 * 60 * 1000; // 8h00
    const result = calculator.msToHoursMinutes(duration);

    Assert.equal(result.hours, 8);
    Assert.equal(result.minutes, 0);
});

// ======================
// Tests de calcul du pourcentage
// ======================

runner.test('Calcule le pourcentage pour 4h (50%)', () => {
    const duration = 4 * 60 * 60 * 1000; // 4 heures
    const percentage = calculator.getCompletionPercentage(duration);

    Assert.equal(percentage, 50);
});

runner.test('Calcule le pourcentage pour 8h (100%)', () => {
    const duration = 8 * 60 * 60 * 1000; // 8 heures
    const percentage = calculator.getCompletionPercentage(duration);

    Assert.equal(percentage, 100);
});

runner.test('Peut dépasser 100% pour plus de 8h', () => {
    const duration = 10 * 60 * 60 * 1000; // 10 heures
    const percentage = calculator.getCompletionPercentage(duration);

    Assert.equal(percentage, 125);
});

runner.test('Retourne 0% pour 0h', () => {
    const duration = 0;
    const percentage = calculator.getCompletionPercentage(duration);

    Assert.equal(percentage, 0);
});

// Exécuter les tests
runner.run();
