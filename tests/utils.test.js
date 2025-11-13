'use strict';

import { TestRunner, Assert } from './test-runner.js';
import {
    formatDuration,
    formatTime,
    formatDate,
    getTodayDateString,
    getEntryTypeLabel,
    escapeHtml,
    createElement
} from '../js/utils.js';
import { ENTRY_TYPES } from '../js/time-entry.js';

const runner = new TestRunner();

// ======================
// Tests de formatDuration
// ======================

runner.test('Formate une durée de 8h00', () => {
    const duration = 8 * 60 * 60 * 1000;
    const result = formatDuration(duration);
    Assert.equal(result, '8h 00m');
});

runner.test('Formate une durée de 5h30', () => {
    const duration = 5 * 60 * 60 * 1000 + 30 * 60 * 1000;
    const result = formatDuration(duration);
    Assert.equal(result, '5h 30m');
});

runner.test('Formate une durée de 0h15', () => {
    const duration = 15 * 60 * 1000;
    const result = formatDuration(duration);
    Assert.equal(result, '0h 15m');
});

runner.test('Retourne 0h 00m pour une durée nulle', () => {
    const result = formatDuration(0);
    Assert.equal(result, '0h 00m');
});

runner.test('Retourne 0h 00m pour une durée négative', () => {
    const result = formatDuration(-1000);
    Assert.equal(result, '0h 00m');
});

runner.test('Retourne 0h 00m pour null', () => {
    const result = formatDuration(null);
    Assert.equal(result, '0h 00m');
});

runner.test('Formate correctement avec des minutes < 10', () => {
    const duration = 3 * 60 * 60 * 1000 + 5 * 60 * 1000; // 3h05
    const result = formatDuration(duration);
    Assert.equal(result, '3h 05m');
});

// ======================
// Tests de formatTime
// ======================

runner.test('Formate une heure correctement (HH:MM)', () => {
    const date = new Date('2025-11-13T09:00:00');
    const result = formatTime(date);
    Assert.equal(result, '09:00');
});

runner.test('Formate une heure de l\'après-midi', () => {
    const date = new Date('2025-11-13T14:30:00');
    const result = formatTime(date);
    Assert.equal(result, '14:30');
});

runner.test('Retourne --:-- pour une date invalide', () => {
    const result = formatTime(new Date('invalid'));
    Assert.equal(result, '--:--');
});

runner.test('Retourne --:-- pour null', () => {
    const result = formatTime(null);
    Assert.equal(result, '--:--');
});

runner.test('Retourne --:-- pour undefined', () => {
    const result = formatTime(undefined);
    Assert.equal(result, '--:--');
});

// ======================
// Tests de formatDate
// ======================

runner.test('Formate une date au format YYYY-MM-DD', () => {
    const date = new Date('2025-11-13T09:00:00');
    const result = formatDate(date);
    Assert.equal(result, '2025-11-13');
});

runner.test('Retourne une chaîne vide pour une date invalide', () => {
    const result = formatDate(new Date('invalid'));
    Assert.equal(result, '');
});

runner.test('Retourne une chaîne vide pour null', () => {
    const result = formatDate(null);
    Assert.equal(result, '');
});

runner.test('Gère correctement les mois < 10', () => {
    const date = new Date('2025-03-05T00:00:00');
    const result = formatDate(date);
    Assert.equal(result, '2025-03-05');
});

// ======================
// Tests de getTodayDateString
// ======================

runner.test('Retourne la date du jour au format YYYY-MM-DD', () => {
    const result = getTodayDateString();
    const today = new Date();
    const expected = formatDate(today);

    Assert.equal(result, expected);
});

runner.test('Le résultat est une chaîne non vide', () => {
    const result = getTodayDateString();
    Assert.notEqual(result, '');
});

// ======================
// Tests de getEntryTypeLabel
// ======================

runner.test('Retourne "Arrivée" pour clock-in', () => {
    const result = getEntryTypeLabel(ENTRY_TYPES.CLOCK_IN);
    Assert.equal(result, 'Arrivée');
});

runner.test('Retourne "Début pause" pour lunch-start', () => {
    const result = getEntryTypeLabel(ENTRY_TYPES.LUNCH_START);
    Assert.equal(result, 'Début pause');
});

runner.test('Retourne "Fin pause" pour lunch-end', () => {
    const result = getEntryTypeLabel(ENTRY_TYPES.LUNCH_END);
    Assert.equal(result, 'Fin pause');
});

runner.test('Retourne "Départ" pour clock-out', () => {
    const result = getEntryTypeLabel(ENTRY_TYPES.CLOCK_OUT);
    Assert.equal(result, 'Départ');
});

runner.test('Retourne le type original pour un type inconnu', () => {
    const result = getEntryTypeLabel('unknown-type');
    Assert.equal(result, 'unknown-type');
});

// ======================
// Tests de escapeHtml
// ======================

runner.test('Échappe les caractères HTML dangereux', () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHtml(input);

    Assert.notContains(result.split(''), '<');
    Assert.notContains(result.split(''), '>');
});

runner.test('Échappe les guillemets et apostrophes', () => {
    const input = 'Test "quotes" and \'apostrophes\'';
    const result = escapeHtml(input);

    // Le résultat doit être sûr
    Assert.isDefined(result);
    Assert.notEqual(result, '');
});

runner.test('Retourne une chaîne vide pour null', () => {
    const result = escapeHtml(null);
    Assert.equal(result, '');
});

runner.test('Retourne une chaîne vide pour undefined', () => {
    const result = escapeHtml(undefined);
    Assert.equal(result, '');
});

runner.test('Retourne une chaîne vide pour une chaîne vide', () => {
    const result = escapeHtml('');
    Assert.equal(result, '');
});

runner.test('Ne modifie pas le texte normal', () => {
    const input = 'Hello World';
    const result = escapeHtml(input);
    Assert.equal(result, 'Hello World');
});

// ======================
// Tests de createElement
// ======================

runner.test('Crée un élément avec un tag', () => {
    const element = createElement('div');
    Assert.instanceOf(element, HTMLElement);
    Assert.equal(element.tagName, 'DIV');
});

runner.test('Crée un élément avec une classe', () => {
    const element = createElement('div', { class: 'test-class' });
    Assert.equal(element.className, 'test-class');
});

runner.test('Crée un élément avec un ID', () => {
    const element = createElement('div', { id: 'test-id' });
    Assert.equal(element.id, 'test-id');
});

runner.test('Crée un élément avec du contenu texte', () => {
    const element = createElement('div', {}, 'Hello World');
    Assert.equal(element.textContent, 'Hello World');
});

runner.test('Crée un élément avec un enfant HTMLElement', () => {
    const child = document.createElement('span');
    child.textContent = 'Child';

    const element = createElement('div', {}, child);
    Assert.equal(element.children.length, 1);
    Assert.equal(element.children[0].tagName, 'SPAN');
});

runner.test('Crée un élément avec plusieurs enfants', () => {
    const children = [
        'Text 1',
        document.createElement('span'),
        'Text 2'
    ];

    const element = createElement('div', {}, children);
    Assert.greaterThan(element.childNodes.length, 0);
});

runner.test('Crée un élément avec des attributs data-*', () => {
    const element = createElement('div', {
        dataset: {
            userId: '123',
            userName: 'John'
        }
    });

    Assert.equal(element.dataset.userId, '123');
    Assert.equal(element.dataset.userName, 'John');
});

runner.test('Crée un élément avec plusieurs attributs', () => {
    const element = createElement('button', {
        type: 'button',
        disabled: 'disabled',
        class: 'btn'
    });

    Assert.equal(element.getAttribute('type'), 'button');
    Assert.equal(element.getAttribute('disabled'), 'disabled');
    Assert.equal(element.className, 'btn');
});

runner.test('Crée un élément sans attributs ni enfants', () => {
    const element = createElement('div');
    Assert.instanceOf(element, HTMLElement);
    Assert.equal(element.children.length, 0);
    Assert.equal(element.attributes.length, 0);
});

// Exécuter les tests
runner.run();
