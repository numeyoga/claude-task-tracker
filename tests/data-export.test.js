'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { DataExporter } from '../js/data-export.js';
import { TimeEntry } from '../js/time-entry.js';
import { Project } from '../js/project.js';
import { ProjectSession } from '../js/project-session.js';

const runner = new TestRunner();
const exporter = new DataExporter();

// ======================
// Tests d'export de pointages
// ======================

runner.test('Exporte des pointages en CSV', () => {
    const entries = [
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00')),
        new TimeEntry('clock-out', new Date('2025-11-13T18:00:00'))
    ];

    const csv = exporter.exportTimeEntriesToCSV(entries);

    Assert.isTrue(csv.includes('Date'), 'Devrait contenir l\'en-tête "Date"');
    Assert.isTrue(csv.includes('Heure'), 'Devrait contenir l\'en-tête "Heure"');
    Assert.isTrue(csv.includes('Type'), 'Devrait contenir l\'en-tête "Type"');
    Assert.isTrue(csv.includes('2025-11-13'), 'Devrait contenir la date');
});

runner.test('Exporte des pointages en JSON', () => {
    const entries = [
        new TimeEntry('clock-in', new Date('2025-11-13T09:00:00'))
    ];

    const json = exporter.exportTimeEntriesToJSON(entries);
    const data = JSON.parse(json);

    Assert.equal(data.length, 1, 'Devrait contenir 1 entrée');
    Assert.equal(data[0].type, 'clock-in', 'Type devrait être clock-in');
    Assert.equal(data[0].date, '2025-11-13', 'Date devrait être 2025-11-13');
});

runner.test('Retourne une chaîne vide pour des pointages vides (CSV)', () => {
    const csv = exporter.exportTimeEntriesToCSV([]);
    Assert.equal(csv, '', 'Devrait retourner une chaîne vide');
});

// ======================
// Tests d'export de sessions
// ======================

runner.test('Exporte des sessions en CSV', () => {
    const project = new Project('Test Project');
    const session = new ProjectSession(project.id);
    session.stop();

    const csv = exporter.exportProjectSessionsToCSV([session], [project]);

    Assert.isTrue(csv.includes('Date'), 'Devrait contenir l\'en-tête "Date"');
    Assert.isTrue(csv.includes('Projet'), 'Devrait contenir l\'en-tête "Projet"');
    Assert.isTrue(csv.includes('Test Project'), 'Devrait contenir le nom du projet');
});

runner.test('Exporte des sessions en JSON', () => {
    const project = new Project('Test Project');
    const session = new ProjectSession(project.id);
    session.stop();

    const json = exporter.exportProjectSessionsToJSON([session], [project]);
    const data = JSON.parse(json);

    Assert.equal(data.length, 1, 'Devrait contenir 1 session');
    Assert.equal(data[0].projectName, 'Test Project', 'Nom du projet correct');
    Assert.isFalse(data[0].isRunning, 'Session devrait être arrêtée');
});

// ======================
// Tests d'export de rapports
// ======================

runner.test('Exporte un rapport hebdomadaire en CSV', () => {
    const report = {
        period: {
            startDate: '2025-11-10',
            endDate: '2025-11-16',
            totalDays: 7,
            workedDays: 5,
            completeDays: 4,
            incompleteDays: 1
        },
        time: {
            totalPresence: 8 * 3600000,
            totalProject: 6 * 3600000,
            averagePresencePerDay: 8 * 3600000,
            averageProjectPerDay: 6 * 3600000
        },
        projectStats: [],
        dailyStats: [],
        incompleteDaysList: []
    };

    const csv = exporter.exportWeeklyReportToCSV(report);

    Assert.isTrue(csv.includes('Rapport de la période'), 'Devrait contenir le titre');
    Assert.isTrue(csv.includes('2025-11-10'), 'Devrait contenir la date de début');
    Assert.isTrue(csv.includes('Jours travaillés,5'), 'Devrait contenir les jours travaillés');
});

runner.test('Exporte un rapport hebdomadaire en JSON', () => {
    const report = {
        period: {
            startDate: '2025-11-10',
            endDate: '2025-11-16',
            totalDays: 7,
            workedDays: 5,
            completeDays: 4,
            incompleteDays: 1
        },
        time: {
            totalPresence: 8 * 3600000,
            totalProject: 6 * 3600000,
            averagePresencePerDay: 8 * 3600000,
            averageProjectPerDay: 6 * 3600000
        },
        projectStats: [],
        dailyStats: [],
        incompleteDaysList: []
    };

    const json = exporter.exportWeeklyReportToJSON(report);
    const data = JSON.parse(json);

    Assert.equal(data.period.workedDays, 5, 'Devrait contenir 5 jours travaillés');
    Assert.isTrue(data.time.totalPresence.formatted !== undefined, 'Devrait avoir une durée formatée');
});

// ======================
// Tests d'export complet
// ======================

runner.test('Exporte toutes les données en JSON', () => {
    const entry = new TimeEntry('clock-in', new Date('2025-11-13T09:00:00'));
    const project = new Project('Test Project');
    const session = new ProjectSession(project.id);

    const json = exporter.exportAllDataToJSON({
        entries: [entry],
        projects: [project],
        sessions: [session]
    });

    const data = JSON.parse(json);

    Assert.isTrue(data.exportDate !== undefined, 'Devrait avoir une date d\'export');
    Assert.equal(data.version, '2.0.0', 'Version devrait être 2.0.0');
    Assert.equal(data.data.timeEntries.length, 1, 'Devrait contenir 1 entrée');
    Assert.equal(data.data.projects.length, 1, 'Devrait contenir 1 projet');
    Assert.equal(data.data.projectSessions.length, 1, 'Devrait contenir 1 session');
});

// Exécuter les tests
runner.run();
