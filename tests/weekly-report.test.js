'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { WeeklyReportCalculator } from '../js/weekly-report.js';
import { TimeEntry } from '../js/time-entry.js';
import { Project } from '../js/project.js';
import { ProjectSession } from '../js/project-session.js';

const runner = new TestRunner();
const calculator = new WeeklyReportCalculator();

// ======================
// Tests de calcul de périodes
// ======================

runner.test('Obtient le début de la semaine (lundi)', () => {
    const date = new Date('2025-11-13'); // Jeudi
    const weekStart = calculator.getWeekStart(date);

    Assert.equal(weekStart.getDay(), 1, 'Le début de semaine devrait être un lundi');
    Assert.equal(weekStart.getDate(), 10, 'Le lundi devrait être le 10 nov');
});

runner.test('Obtient la fin de la semaine (dimanche)', () => {
    const date = new Date('2025-11-13'); // Jeudi
    const weekEnd = calculator.getWeekEnd(date);

    Assert.equal(weekEnd.getDay(), 0, 'La fin de semaine devrait être un dimanche');
    Assert.equal(weekEnd.getDate(), 16, 'Le dimanche devrait être le 16 nov');
});

runner.test('Obtient le début du mois', () => {
    const date = new Date('2025-11-13');
    const monthStart = calculator.getMonthStart(date);

    Assert.equal(monthStart.getDate(), 1, 'Le début du mois devrait être le 1er');
    Assert.equal(monthStart.getMonth(), 10, 'Le mois devrait être novembre (10)');
});

runner.test('Obtient la fin du mois', () => {
    const date = new Date('2025-11-13');
    const monthEnd = calculator.getMonthEnd(date);

    Assert.equal(monthEnd.getDate(), 30, 'La fin du mois devrait être le 30');
    Assert.equal(monthEnd.getMonth(), 10, 'Le mois devrait être novembre (10)');
});

runner.test('Génère une plage de dates', () => {
    const start = new Date('2025-11-10');
    const end = new Date('2025-11-12');
    const range = calculator.generateDateRange(start, end);

    Assert.equal(range.length, 3, 'Devrait générer 3 dates');
    Assert.equal(range[0], '2025-11-10', 'Première date');
    Assert.equal(range[2], '2025-11-12', 'Dernière date');
});

// ======================
// Tests de formatage
// ======================

runner.test('Formate le nom du mois', () => {
    const date = new Date('2025-11-13');
    const monthName = calculator.getMonthName(date);

    Assert.equal(monthName, 'Novembre', 'Devrait retourner "Novembre"');
});

runner.test('Formate une plage de dates (même mois)', () => {
    const start = new Date('2025-11-10');
    const end = new Date('2025-11-16');
    const formatted = calculator.formatDateRange(start, end);

    Assert.isTrue(formatted.includes('10-16'), 'Devrait contenir "10-16"');
    Assert.isTrue(formatted.includes('Nov'), 'Devrait contenir "Nov"');
});

// ======================
// Tests de calcul de statistiques
// ======================

runner.test('Calcule les statistiques pour une période vide', () => {
    const stats = calculator.calculatePeriodStats({
        startDate: new Date('2025-11-10'),
        endDate: new Date('2025-11-16'),
        entries: [],
        sessions: [],
        projects: []
    });

    Assert.equal(stats.period.workedDays, 0, 'Aucun jour travaillé');
    Assert.equal(stats.time.totalPresence, 0, 'Temps de présence = 0');
    Assert.equal(stats.projectStats.length, 0, 'Aucune stat de projet');
});

runner.test('Détecte les jours incomplets', () => {
    // Créer un jour avec 7h de travail
    const entries = [
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00')),
        new TimeEntry('lunch-start', new Date('2025-11-13T12:00:00')),
        new TimeEntry('lunch-end', new Date('2025-11-13T13:00:00')),
        new TimeEntry('clock-out', new Date('2025-11-13T17:00:00')) // 7h de travail
    ];

    const stats = calculator.calculatePeriodStats({
        startDate: new Date('2025-11-13'),
        endDate: new Date('2025-11-13'),
        entries,
        sessions: [],
        projects: []
    });

    Assert.equal(stats.period.incompleteDays, 1, 'Devrait détecter 1 jour incomplet');
    Assert.equal(stats.incompleteDaysList.length, 1, 'Liste contient 1 jour incomplet');
});

runner.test('Calcule le temps moyen par jour', () => {
    // 2 jours: 8h et 7h
    const entries = [
        // Jour 1: 8h
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00')),
        new TimeEntry('lunch-start', new Date('2025-11-13T12:00:00')),
        new TimeEntry('lunch-end', new Date('2025-11-13T13:00:00')),
        new TimeEntry('clock-out', new Date('2025-11-13T18:00:00')),
        // Jour 2: 7h
        new TimeEntry('clock-in', new Date('2025-11-14T09:00:00')),
        new TimeEntry('lunch-start', new Date('2025-11-14T12:00:00')),
        new TimeEntry('lunch-end', new Date('2025-11-14T13:00:00')),
        new TimeEntry('clock-out', new Date('2025-11-14T17:00:00'))
    ];

    const stats = calculator.calculatePeriodStats({
        startDate: new Date('2025-11-13'),
        endDate: new Date('2025-11-14'),
        entries,
        sessions: [],
        projects: []
    });

    const avgHours = stats.time.averagePresencePerDay / (1000 * 60 * 60);
    Assert.equal(avgHours, 7.5, 'Moyenne devrait être 7.5h');
});

// Exécuter les tests
runner.run();
