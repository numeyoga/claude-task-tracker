'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { TimeEntry, ENTRY_TYPES } from '../js/time-entry.js';

const runner = new TestRunner();

// ======================
// Tests de création
// ======================

runner.test('Crée une TimeEntry avec des valeurs valides', () => {
    const timestamp = new Date('2025-11-13T09:00:00');
    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, timestamp);

    Assert.instanceOf(entry, TimeEntry);
    Assert.equal(entry.type, ENTRY_TYPES.CLOCK_IN);
    Assert.equal(entry.timestamp.getTime(), timestamp.getTime());
    Assert.equal(entry.date, '2025-11-13');
    Assert.isDefined(entry.id);
});

runner.test('Utilise la date actuelle si aucun timestamp n\'est fourni', () => {
    const before = Date.now();
    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN);
    const after = Date.now();

    Assert.greaterThanOrEqual(entry.timestamp.getTime(), before);
    Assert.lessThanOrEqual(entry.timestamp.getTime(), after);
});

runner.test('Génère un ID unique pour chaque entrée', () => {
    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN);
    const entry2 = new TimeEntry(ENTRY_TYPES.CLOCK_IN);

    Assert.notEqual(entry1.id, entry2.id);
    Assert.isDefined(entry1.id);
    Assert.isDefined(entry2.id);
});

runner.test('Accepte une note optionnelle', () => {
    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date(), 'Ma note');
    Assert.equal(entry.note, 'Ma note');
});

// ======================
// Tests de validation
// ======================

runner.test('Lance une erreur si le type est invalide', () => {
    Assert.throws(
        () => new TimeEntry('invalid-type'),
        Error
    );
});

runner.test('Lance une erreur si le timestamp n\'est pas une Date', () => {
    Assert.throws(
        () => new TimeEntry(ENTRY_TYPES.CLOCK_IN, '2025-11-13'),
        Error
    );
});

runner.test('Lance une erreur si le timestamp est invalide', () => {
    Assert.throws(
        () => new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('invalid')),
        Error
    );
});

runner.test('Lance une erreur si le timestamp est dans le futur', () => {
    const futureDate = new Date(Date.now() + 100000);
    Assert.throws(
        () => new TimeEntry(ENTRY_TYPES.CLOCK_IN, futureDate),
        Error
    );
});

// ======================
// Tests de sérialisation
// ======================

runner.test('Sérialise correctement en JSON', () => {
    const timestamp = new Date('2025-11-13T09:00:00');
    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, timestamp, 'Test note');
    const json = entry.toJSON();

    Assert.equal(json.type, ENTRY_TYPES.CLOCK_IN);
    Assert.equal(json.timestamp, timestamp.toISOString());
    Assert.equal(json.date, '2025-11-13');
    Assert.equal(json.note, 'Test note');
    Assert.isDefined(json.id);
});

runner.test('Désérialise correctement depuis JSON', () => {
    const json = {
        id: 'test-id-123',
        type: ENTRY_TYPES.LUNCH_START,
        timestamp: '2025-11-13T12:00:00.000Z',
        date: '2025-11-13',
        note: 'Test'
    };

    const entry = TimeEntry.fromJSON(json);

    Assert.instanceOf(entry, TimeEntry);
    Assert.equal(entry.id, 'test-id-123');
    Assert.equal(entry.type, ENTRY_TYPES.LUNCH_START);
    Assert.equal(entry.note, 'Test');
    Assert.instanceOf(entry.timestamp, Date);
});

runner.test('Lance une erreur si fromJSON reçoit des données invalides', () => {
    Assert.throws(
        () => TimeEntry.fromJSON(null),
        Error
    );

    Assert.throws(
        () => TimeEntry.fromJSON(undefined),
        Error
    );

    Assert.throws(
        () => TimeEntry.fromJSON('not an object'),
        Error
    );
});

// ======================
// Tests des types d'entrées
// ======================

runner.test('Accepte tous les types d\'entrée valides', () => {
    const types = Object.values(ENTRY_TYPES);

    types.forEach(type => {
        const entry = new TimeEntry(type);
        Assert.equal(entry.type, type);
    });
});

runner.test('ENTRY_TYPES contient tous les types attendus', () => {
    Assert.equal(ENTRY_TYPES.CLOCK_IN, 'clock-in');
    Assert.equal(ENTRY_TYPES.LUNCH_START, 'lunch-start');
    Assert.equal(ENTRY_TYPES.LUNCH_END, 'lunch-end');
    Assert.equal(ENTRY_TYPES.CLOCK_OUT, 'clock-out');
});

// Exécuter les tests
runner.run();
