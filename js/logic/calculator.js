'use strict';

import { ENTRY_TYPES, isBreakStart, isBreakEnd } from '../model/entry.js';
import { pipe, reduce } from '../core/fp.js';

/**
 * Constantes pour les calculs
 */
const WORK_DAY_HOURS = 8;
const MILLISECONDS_PER_HOUR = 3600000;
const MILLISECONDS_PER_MINUTE = 60000;

/**
 * États possibles d'une journée de travail
 */
export const DayStatus = Object.freeze({
    NOT_STARTED: 'not-started',
    MORNING: 'morning',
    LUNCH: 'lunch',
    AFTERNOON: 'afternoon',
    COMPLETED: 'completed'
});

/**
 * Trouve toutes les paires de pauses (start/end) dans les pointages
 * Version fonctionnelle avec reduce
 * @param {Array} entries - Liste des pointages
 * @returns {Array} Paires de pauses
 */
export const getBreakPairs = (entries) => {
    const sortedEntries = [...entries].sort((a, b) =>
        a.timestamp.getTime() - b.timestamp.getTime()
    );

    const result = sortedEntries.reduce(
        ({ pairs, currentStart }, entry) => {
            if (isBreakStart(entry.type)) {
                // Début d'une nouvelle pause
                return {
                    pairs: currentStart
                        ? [...pairs, { start: currentStart, end: null }]
                        : pairs,
                    currentStart: entry
                };
            }

            if (isBreakEnd(entry.type) && currentStart) {
                // Fin de la pause en cours
                return {
                    pairs: [...pairs, { start: currentStart, end: entry }],
                    currentStart: null
                };
            }

            // Pas de changement
            return { pairs, currentStart };
        },
        { pairs: [], currentStart: null }
    );

    // Ajouter la pause en cours si elle existe
    return result.currentStart
        ? [...result.pairs, { start: result.currentStart, end: null }]
        : result.pairs;
};

/**
 * Calcule la durée d'une paire de pause
 * @param {Object} pair - Paire {start, end}
 * @returns {number} Durée en millisecondes
 */
const calculateBreakDuration = (pair) => {
    if (pair.end) {
        return pair.end.timestamp.getTime() - pair.start.timestamp.getTime();
    }
    // Pause en cours
    return Date.now() - pair.start.timestamp.getTime();
};

/**
 * Calcule le temps total des pauses
 * @param {Array} entries - Liste des pointages
 * @returns {number} Durée totale des pauses en millisecondes
 */
export const calculateBreaksDuration = (entries) =>
    pipe(
        getBreakPairs,
        pairs => pairs.map(calculateBreakDuration),
        durations => durations.reduce((sum, d) => sum + d, 0)
    )(entries);

/**
 * Calcule le temps de présence à partir des pointages
 * Formule: temps total - somme de toutes les pauses
 * @param {Array} entries - Liste des pointages du jour
 * @returns {number} Durée en millisecondes
 */
export const calculatePresenceTime = (entries) => {
    if (!entries || entries.length === 0) {
        return 0;
    }

    const clockIn = entries.find(e => e.type === ENTRY_TYPES.CLOCK_IN);
    const clockOut = entries.find(e => e.type === ENTRY_TYPES.CLOCK_OUT);

    if (!clockIn) {
        return 0;
    }

    // Calculer le temps total (du clock-in au clock-out ou maintenant)
    const endTime = clockOut ? clockOut.timestamp.getTime() : Date.now();
    const totalTime = endTime - clockIn.timestamp.getTime();

    // Soustraire les pauses
    const breaksDuration = calculateBreaksDuration(entries);

    return Math.max(0, totalTime - breaksDuration);
};

/**
 * Vérifie si l'objectif de 8h de travail est atteint
 * @param {number} duration - Durée en millisecondes
 * @returns {boolean} true si >= 8h
 */
export const isWorkDayComplete = (duration) =>
    duration >= WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;

/**
 * Calcule le temps restant pour atteindre l'objectif de 8h
 * @param {number} duration - Durée actuelle en millisecondes
 * @returns {number} Temps restant en millisecondes (0 si objectif atteint)
 */
export const getRemainingTime = (duration) => {
    const target = WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
    return Math.max(0, target - duration);
};

/**
 * Calcule le pourcentage de l'objectif de 8h atteint
 * @param {number} duration - Durée actuelle en millisecondes
 * @returns {number} Pourcentage (0-100, peut dépasser 100)
 */
export const getCompletionPercentage = (duration) => {
    const target = WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
    return Math.round((duration / target) * 100);
};

/**
 * Convertit une durée en millisecondes en objet heures/minutes
 * @param {number} milliseconds - Durée en millisecondes
 * @returns {Object} {hours: number, minutes: number}
 */
export const msToHoursMinutes = (milliseconds) => {
    const totalMinutes = Math.floor(milliseconds / MILLISECONDS_PER_MINUTE);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return { hours, minutes };
};

/**
 * Détermine l'état actuel de la journée
 * @param {Array} entries - Liste des pointages du jour
 * @returns {string} État de la journée (DayStatus)
 */
export const getDayStatus = (entries) => {
    if (!entries || entries.length === 0) {
        return DayStatus.NOT_STARTED;
    }

    const hasClockIn = entries.some(e => e.type === ENTRY_TYPES.CLOCK_IN);
    const hasClockOut = entries.some(e => e.type === ENTRY_TYPES.CLOCK_OUT);

    if (hasClockOut) {
        return DayStatus.COMPLETED;
    }

    if (!hasClockIn) {
        return DayStatus.NOT_STARTED;
    }

    // Vérifier si on est actuellement en pause
    const breakPairs = getBreakPairs(entries);
    const hasOpenBreak = breakPairs.some(pair => pair.end === null);

    if (hasOpenBreak) {
        return DayStatus.LUNCH; // Réutiliser LUNCH pour "en pause"
    }

    // On est en train de travailler (mais pas en pause)
    const hasAnyBreak = breakPairs.length > 0;
    return hasAnyBreak ? DayStatus.AFTERNOON : DayStatus.MORNING;
};

/**
 * Détermine tous les boutons qui doivent être activés
 * @param {Array} entries - Liste des pointages du jour
 * @returns {Array<string>} Liste des types de pointages disponibles
 */
export const getEnabledButtons = (entries) => {
    const status = getDayStatus(entries);
    const enabled = [];

    switch (status) {
        case DayStatus.NOT_STARTED:
            enabled.push(ENTRY_TYPES.CLOCK_IN);
            break;

        case DayStatus.MORNING:
        case DayStatus.AFTERNOON:
            // En train de travailler : on peut prendre une pause ou partir
            enabled.push(ENTRY_TYPES.BREAK_START);
            enabled.push(ENTRY_TYPES.CLOCK_OUT);
            break;

        case DayStatus.LUNCH:
            // En pause : on peut seulement reprendre le travail
            enabled.push(ENTRY_TYPES.BREAK_END);
            break;

        case DayStatus.COMPLETED:
            // Journée terminée : aucun bouton
            break;
    }

    return enabled;
};

/**
 * Détermine quel bouton doit être activé en fonction de l'état du jour
 * @deprecated Utiliser getEnabledButtons pour supporter plusieurs pauses
 * @param {Array} entries - Liste des pointages du jour
 * @returns {string|null} Type du prochain pointage attendu ou null
 */
export const getNextExpectedEntry = (entries) => {
    const enabled = getEnabledButtons(entries);
    return enabled.length > 0 ? enabled[0] : null;
};

// ======================
// Calculs pour les projets
// ======================

/**
 * Calcule le temps total passé sur un projet pour une liste de sessions
 * @param {Array} sessions - Liste des sessions du projet
 * @param {boolean} includeRunning - Inclure la session en cours dans le calcul
 * @returns {number} Durée totale en millisecondes
 */
export const calculateProjectTime = (sessions, includeRunning = true) => {
    if (!sessions || sessions.length === 0) {
        return 0;
    }

    return sessions.reduce((total, session) => {
        if (!includeRunning && session.endTime === null) {
            return total;
        }

        const duration = session.endTime
            ? session.endTime.getTime() - session.startTime.getTime()
            : Date.now() - session.startTime.getTime();

        return total + duration;
    }, 0);
};

/**
 * Calcule le temps passé par projet pour une journée
 * @param {Array} sessions - Liste des sessions de la journée
 * @param {Array} projects - Liste des projets
 * @returns {Array} Liste d'objets {projectId, projectName, duration, percentage, isRunning}
 */
export const calculateProjectStats = (sessions, projects) => {
    if (!sessions || sessions.length === 0) {
        return [];
    }

    // Grouper les sessions par projet
    const sessionsByProject = sessions.reduce((acc, session) => {
        if (!acc[session.projectId]) {
            acc[session.projectId] = [];
        }
        acc[session.projectId].push(session);
        return acc;
    }, {});

    // Calculer le temps total de toutes les sessions
    const totalTime = sessions.reduce((sum, session) => {
        const duration = session.endTime
            ? session.endTime.getTime() - session.startTime.getTime()
            : Date.now() - session.startTime.getTime();
        return sum + duration;
    }, 0);

    // Créer les statistiques par projet
    const stats = Object.keys(sessionsByProject).map(projectId => {
        const project = projects.find(p => p.id === projectId);
        const projectSessions = sessionsByProject[projectId];
        const duration = calculateProjectTime(projectSessions);
        const percentage = totalTime > 0 ? Math.round((duration / totalTime) * 100) : 0;

        return {
            projectId,
            projectName: project ? project.name : 'Projet inconnu',
            duration,
            percentage,
            isRunning: projectSessions.some(s => s.endTime === null)
        };
    });

    // Trier par durée décroissante
    return stats.sort((a, b) => b.duration - a.duration);
};

/**
 * Calcule le temps total de toutes les sessions
 * @param {Array} sessions - Liste des sessions
 * @returns {number} Durée totale en millisecondes
 */
export const calculateTotalProjectTime = (sessions) => {
    if (!sessions || sessions.length === 0) {
        return 0;
    }

    return sessions.reduce((total, session) => {
        const duration = session.endTime
            ? session.endTime.getTime() - session.startTime.getTime()
            : Date.now() - session.startTime.getTime();
        return total + duration;
    }, 0);
};
