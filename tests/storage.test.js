'use strict';

import { TestRunner, Assert } from './test-runner.js';
import { StorageService } from '../js/storage.js';
import { TimeEntry, ENTRY_TYPES } from '../js/time-entry.js';

const runner = new TestRunner();

// Créer une instance de storage pour les tests
let storage;

// ======================
// Tests d'initialisation
// ======================

runner.test('Initialise la base de données avec succès', async () => {
    storage = new StorageService();
    await storage.init();

    Assert.isNotNull(storage.db);
    Assert.isDefined(storage.db);
});

// ======================
// Tests de sauvegarde d'entrées
// ======================

runner.test('Sauvegarde une entrée valide', async () => {
    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const id = await storage.saveEntry(entry);

    Assert.isDefined(id);
    Assert.equal(id, entry.id);
});

runner.test('Lance une erreur si l\'entrée n\'est pas une TimeEntry', async () => {
    try {
        await storage.saveEntry({ type: 'clock-in', timestamp: new Date() });
        Assert.isTrue(false, 'Devrait lancer une erreur');
    } catch (error) {
        Assert.instanceOf(error, Error);
    }
});

// ======================
// Tests de récupération par date
// ======================

runner.test('Récupère les entrées d\'un jour spécifique', async () => {
    // Nettoyer d'abord
    await storage.clearAll();

    // Ajouter des entrées pour le 13 novembre
    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const entry2 = new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'));

    // Ajouter une entrée pour un autre jour
    const entry3 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-14T09:00:00'));

    await storage.saveEntry(entry1);
    await storage.saveEntry(entry2);
    await storage.saveEntry(entry3);

    // Récupérer seulement les entrées du 13
    const entries = await storage.getEntriesByDate('2025-11-13');

    Assert.equal(entries.length, 2);
    Assert.equal(entries[0].date, '2025-11-13');
    Assert.equal(entries[1].date, '2025-11-13');
});

runner.test('Retourne un tableau vide pour un jour sans entrées', async () => {
    await storage.clearAll();

    const entries = await storage.getEntriesByDate('2025-12-25');
    Assert.equal(entries.length, 0);
});

runner.test('Les entrées sont triées par timestamp croissant', async () => {
    await storage.clearAll();

    // Ajouter des entrées dans le désordre
    const entry2 = new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'));
    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const entry3 = new TimeEntry(ENTRY_TYPES.CLOCK_OUT, new Date('2025-11-13T18:00:00'));

    await storage.saveEntry(entry2);
    await storage.saveEntry(entry1);
    await storage.saveEntry(entry3);

    const entries = await storage.getEntriesByDate('2025-11-13');

    Assert.equal(entries.length, 3);
    Assert.equal(entries[0].type, ENTRY_TYPES.CLOCK_IN);
    Assert.equal(entries[1].type, ENTRY_TYPES.LUNCH_START);
    Assert.equal(entries[2].type, ENTRY_TYPES.CLOCK_OUT);
});

// ======================
// Tests de récupération par ID
// ======================

runner.test('Récupère une entrée par son ID', async () => {
    await storage.clearAll();

    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    await storage.saveEntry(entry);

    const retrieved = await storage.getEntryById(entry.id);

    Assert.isNotNull(retrieved);
    Assert.equal(retrieved.id, entry.id);
    Assert.equal(retrieved.type, entry.type);
});

runner.test('Retourne null pour un ID inexistant', async () => {
    const retrieved = await storage.getEntryById('non-existent-id');
    Assert.isNull(retrieved);
});

// ======================
// Tests de suppression
// ======================

runner.test('Supprime une entrée par son ID', async () => {
    await storage.clearAll();

    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    await storage.saveEntry(entry);

    await storage.deleteEntry(entry.id);

    const retrieved = await storage.getEntryById(entry.id);
    Assert.isNull(retrieved);
});

runner.test('La suppression d\'un ID inexistant ne lance pas d\'erreur', async () => {
    await storage.deleteEntry('non-existent-id');
    // Si on arrive ici sans erreur, le test passe
    Assert.isTrue(true);
});

// ======================
// Tests de récupération de toutes les entrées
// ======================

runner.test('Récupère toutes les entrées de la base', async () => {
    await storage.clearAll();

    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const entry2 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-14T09:00:00'));
    const entry3 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-15T09:00:00'));

    await storage.saveEntry(entry1);
    await storage.saveEntry(entry2);
    await storage.saveEntry(entry3);

    const entries = await storage.getAllEntries();

    Assert.equal(entries.length, 3);
});

runner.test('Les entrées sont triées par timestamp décroissant (plus récent en premier)', async () => {
    await storage.clearAll();

    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const entry2 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-14T09:00:00'));
    const entry3 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-15T09:00:00'));

    await storage.saveEntry(entry1);
    await storage.saveEntry(entry2);
    await storage.saveEntry(entry3);

    const entries = await storage.getAllEntries();

    Assert.equal(entries[0].date, '2025-11-15');
    Assert.equal(entries[1].date, '2025-11-14');
    Assert.equal(entries[2].date, '2025-11-13');
});

runner.test('Retourne un tableau vide si la base est vide', async () => {
    await storage.clearAll();

    const entries = await storage.getAllEntries();
    Assert.equal(entries.length, 0);
});

// ======================
// Tests de clearAll
// ======================

runner.test('Supprime toutes les données de la base', async () => {
    const entry1 = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    const entry2 = new TimeEntry(ENTRY_TYPES.LUNCH_START, new Date('2025-11-13T12:00:00'));

    await storage.saveEntry(entry1);
    await storage.saveEntry(entry2);

    await storage.clearAll();

    const entries = await storage.getAllEntries();
    Assert.equal(entries.length, 0);
});

// ======================
// Tests de mise à jour
// ======================

runner.test('Met à jour une entrée existante', async () => {
    await storage.clearAll();

    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    await storage.saveEntry(entry);

    // Modifier la note
    entry.note = 'Note mise à jour';
    await storage.saveEntry(entry);

    const retrieved = await storage.getEntryById(entry.id);
    Assert.equal(retrieved.note, 'Note mise à jour');
});

// ======================
// Tests de persistance
// ======================

runner.test('Les données persistent après récupération', async () => {
    await storage.clearAll();

    const originalEntry = new TimeEntry(
        ENTRY_TYPES.CLOCK_IN,
        new Date('2025-11-13T09:30:45'),
        'Test note'
    );

    await storage.saveEntry(originalEntry);

    const retrieved = await storage.getEntryById(originalEntry.id);

    Assert.equal(retrieved.id, originalEntry.id);
    Assert.equal(retrieved.type, originalEntry.type);
    Assert.equal(retrieved.note, originalEntry.note);
    Assert.equal(retrieved.date, originalEntry.date);

    // Vérifier que le timestamp est bien persisté
    Assert.equal(
        retrieved.timestamp.getTime(),
        originalEntry.timestamp.getTime()
    );
});

runner.test('Récupère correctement les instances de TimeEntry', async () => {
    await storage.clearAll();

    const entry = new TimeEntry(ENTRY_TYPES.CLOCK_IN, new Date('2025-11-13T09:00:00'));
    await storage.saveEntry(entry);

    const entries = await storage.getEntriesByDate('2025-11-13');

    Assert.equal(entries.length, 1);
    Assert.instanceOf(entries[0], TimeEntry);
    Assert.instanceOf(entries[0].timestamp, Date);
});

// Exécuter les tests
runner.run();
