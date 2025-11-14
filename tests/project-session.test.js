'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { ProjectSession } from '../js/project-session.js';

const runner = new TestRunner();

// ======================
// Tests ProjectSession
// ======================

runner.test('Crée une session avec les bonnes propriétés', () => {
    const projectId = 'test-project-123';
    const session = new ProjectSession(projectId);

    Assert.equal(session.projectId, projectId, 'Le projectId devrait correspondre');
    Assert.isNotNull(session.id, 'La session devrait avoir un ID');
    Assert.instanceOf(session.startTime, Date, 'startTime devrait être une instance de Date');
    Assert.isNull(session.endTime, 'endTime devrait être null au départ');
    Assert.isTrue(session.isRunning(), 'La session devrait être en cours');
});

runner.test('Calcule correctement la durée d\'une session en cours', () => {
    const startTime = new Date(Date.now() - 5000); // Il y a 5 secondes
    const session = new ProjectSession('test-project', startTime);

    const duration = session.getDuration();

    // La durée devrait être d'environ 5 secondes (avec une marge d'erreur)
    Assert.isTrue(
        duration >= 4900 && duration <= 5100,
        `La durée devrait être d'environ 5000ms, mais est de ${duration}ms`
    );
});

runner.test('Arrête correctement une session', () => {
    const startTime = new Date(Date.now() - 10000); // Il y a 10 secondes
    const session = new ProjectSession('test-project', startTime);

    Assert.isTrue(session.isRunning(), 'La session devrait être en cours au départ');

    const endTime = new Date();
    session.stop(endTime);

    Assert.isFalse(session.isRunning(), 'La session ne devrait plus être en cours');
    Assert.isNotNull(session.endTime, 'endTime ne devrait plus être null');
    Assert.equal(session.endTime, endTime, 'endTime devrait correspondre');
});

runner.test('Lance une erreur si on arrête une session déjà terminée', () => {
    const session = new ProjectSession('test-project');
    session.stop();

    Assert.throws(
        () => session.stop(),
        Error,
        'Devrait lancer une erreur si on arrête une session déjà terminée'
    );
});

runner.test('Lance une erreur si la date de fin est avant la date de début', () => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() - 1000); // 1 seconde avant
    const session = new ProjectSession('test-project', startTime);

    Assert.throws(
        () => session.stop(endTime),
        Error,
        'Devrait lancer une erreur si la date de fin est avant la date de début'
    );
});

runner.test('Convertit correctement en JSON', () => {
    const projectId = 'test-project-123';
    const startTime = new Date('2025-11-14T10:00:00Z');
    const session = new ProjectSession(projectId, startTime);

    const json = session.toJSON();

    Assert.equal(json.projectId, projectId);
    Assert.equal(json.startTime, startTime.toISOString());
    Assert.isNull(json.endTime);
    Assert.equal(json.date, '2025-11-14');
    Assert.isTrue(json.duration >= 0);
});

runner.test('Crée une session depuis JSON', () => {
    const data = {
        id: 'session-123',
        projectId: 'project-456',
        startTime: '2025-11-14T10:00:00Z',
        endTime: '2025-11-14T11:00:00Z',
        date: '2025-11-14',
        duration: 3600000
    };

    const session = ProjectSession.fromJSON(data);

    Assert.equal(session.id, data.id);
    Assert.equal(session.projectId, data.projectId);
    Assert.instanceOf(session.startTime, Date);
    Assert.instanceOf(session.endTime, Date);
    Assert.equal(session.date, data.date);
    Assert.isFalse(session.isRunning());
});

// Exécuter les tests
runner.run();
