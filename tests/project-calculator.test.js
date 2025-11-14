'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { TimeCalculator } from '../js/calculator.js';
import { ProjectSession } from '../js/project-session.js';
import { Project } from '../js/project.js';

const runner = new TestRunner();
const calculator = new TimeCalculator();

// ======================
// Tests pour les calculs de projets
// ======================

runner.test('Calcule correctement le temps d\'un projet avec plusieurs sessions', () => {
    const projectId = 'project-1';

    // Créer des sessions: 1h, 2h, 30min
    const sessions = [
        new ProjectSession(projectId, new Date('2025-11-14T09:00:00Z'), new Date('2025-11-14T10:00:00Z')),
        new ProjectSession(projectId, new Date('2025-11-14T11:00:00Z'), new Date('2025-11-14T13:00:00Z')),
        new ProjectSession(projectId, new Date('2025-11-14T14:00:00Z'), new Date('2025-11-14T14:30:00Z'))
    ];

    const totalTime = calculator.calculateProjectTime(sessions);

    // 1h + 2h + 30min = 3h30 = 12600000ms
    Assert.equal(totalTime, 12600000, 'Le temps total devrait être de 3h30');
});

runner.test('Retourne 0 pour un projet sans sessions', () => {
    const totalTime = calculator.calculateProjectTime([]);
    Assert.equal(totalTime, 0, 'Le temps devrait être 0 sans sessions');
});

runner.test('Calcule les statistiques par projet correctement', () => {
    const project1 = new Project('Projet A');
    const project2 = new Project('Projet B');

    project1.id = 'project-1';
    project2.id = 'project-2';

    // Projet 1: 2h (60%)
    // Projet 2: 1h20min (40%)
    const sessions = [
        new ProjectSession('project-1', new Date('2025-11-14T09:00:00Z'), new Date('2025-11-14T10:00:00Z')),
        new ProjectSession('project-1', new Date('2025-11-14T11:00:00Z'), new Date('2025-11-14T12:00:00Z')),
        new ProjectSession('project-2', new Date('2025-11-14T13:00:00Z'), new Date('2025-11-14T14:20:00Z'))
    ];

    const projects = [project1, project2];
    const stats = calculator.calculateProjectStats(sessions, projects);

    Assert.equal(stats.length, 2, 'Devrait y avoir 2 projets dans les stats');

    // Le premier devrait être le projet 1 (plus de temps)
    Assert.equal(stats[0].projectId, 'project-1');
    Assert.equal(stats[0].projectName, 'Projet A');
    Assert.equal(stats[0].duration, 7200000); // 2h
    Assert.equal(stats[0].percentage, 60); // 60%

    // Le deuxième devrait être le projet 2
    Assert.equal(stats[1].projectId, 'project-2');
    Assert.equal(stats[1].projectName, 'Projet B');
    Assert.equal(stats[1].duration, 4800000); // 1h20min
    Assert.equal(stats[1].percentage, 40); // 40%
});

runner.test('Retourne un tableau vide si aucune session', () => {
    const projects = [new Project('Projet A')];
    const stats = calculator.calculateProjectStats([], projects);

    Assert.equal(stats.length, 0, 'Devrait retourner un tableau vide sans sessions');
});

runner.test('Gère correctement les sessions en cours dans les statistiques', () => {
    const project1 = new Project('Projet A');
    project1.id = 'project-1';

    // Une session terminée et une en cours
    const sessions = [
        new ProjectSession('project-1', new Date(Date.now() - 3600000), new Date()), // 1h terminée
        new ProjectSession('project-1', new Date(Date.now() - 1800000)) // 30min en cours
    ];

    const projects = [project1];
    const stats = calculator.calculateProjectStats(sessions, projects);

    Assert.equal(stats.length, 1);
    Assert.isTrue(stats[0].isRunning, 'Le projet devrait être marqué comme en cours');
    Assert.isTrue(stats[0].duration > 5400000, 'La durée devrait être > 1h30 (session en cours)');
});

runner.test('Calcule le temps total de toutes les sessions', () => {
    const sessions = [
        new ProjectSession('project-1', new Date('2025-11-14T09:00:00Z'), new Date('2025-11-14T10:00:00Z')),
        new ProjectSession('project-2', new Date('2025-11-14T11:00:00Z'), new Date('2025-11-14T12:30:00Z')),
        new ProjectSession('project-1', new Date('2025-11-14T13:00:00Z'), new Date('2025-11-14T14:00:00Z'))
    ];

    const totalTime = calculator.calculateTotalProjectTime(sessions);

    // 1h + 1h30 + 1h = 3h30 = 12600000ms
    Assert.equal(totalTime, 12600000, 'Le temps total devrait être de 3h30');
});

// Exécuter les tests
runner.run();
