'use strict';

import { ENTRY_TYPES, isBreakStart, isBreakEnd } from './time-entry.js';

/**
 * Constantes pour les calculs
 */
const WORK_DAY_HOURS = 8;
const MILLISECONDS_PER_HOUR = 3600000;
const MILLISECONDS_PER_MINUTE = 60000;

/**
 * États possibles d'une journée de travail
 */
export const DayStatus = {
    NOT_STARTED: 'not-started',
    MORNING: 'morning',
    LUNCH: 'lunch',
    AFTERNOON: 'afternoon',
    COMPLETED: 'completed'
};

/**
 * Service de calcul des temps de travail
 */
export class TimeCalculator {
    /**
     * Calcule le temps de présence à partir des pointages
     * Formule: temps total - somme de toutes les pauses
     * @param {TimeEntry[]} entries - Liste des pointages du jour (triés par timestamp)
     * @returns {number} Durée en millisecondes
     * @throws {Error} Si les pointages sont incomplets ou invalides
     */
    calculatePresenceTime(entries) {
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
        let totalTime = endTime - clockIn.timestamp.getTime();

        // Trouver toutes les paires de pauses (start/end)
        const breakPairs = this.#getBreakPairs(entries);

        // Soustraire le temps de chaque pause complète
        for (const pair of breakPairs) {
            if (pair.end) {
                totalTime -= (pair.end.timestamp.getTime() - pair.start.timestamp.getTime());
            } else {
                // Pause en cours: soustraire le temps jusqu'à maintenant
                totalTime -= (Date.now() - pair.start.timestamp.getTime());
            }
        }

        return Math.max(0, totalTime);
    }

    /**
     * Trouve toutes les paires de pauses (start/end) dans les pointages
     * @param {TimeEntry[]} entries - Liste des pointages
     * @returns {Array<{start: TimeEntry, end: TimeEntry|null}>} Paires de pauses
     * @private
     */
    #getBreakPairs(entries) {
        const pairs = [];
        let currentBreakStart = null;

        // Trier les entrées par timestamp
        const sortedEntries = [...entries].sort((a, b) =>
            a.timestamp.getTime() - b.timestamp.getTime()
        );

        for (const entry of sortedEntries) {
            if (isBreakStart(entry.type)) {
                // Début d'une nouvelle pause
                if (currentBreakStart) {
                    // Il y avait déjà un début sans fin - on l'ajoute quand même
                    pairs.push({ start: currentBreakStart, end: null });
                }
                currentBreakStart = entry;
            } else if (isBreakEnd(entry.type) && currentBreakStart) {
                // Fin de la pause en cours
                pairs.push({ start: currentBreakStart, end: entry });
                currentBreakStart = null;
            }
        }

        // Si une pause est toujours en cours
        if (currentBreakStart) {
            pairs.push({ start: currentBreakStart, end: null });
        }

        return pairs;
    }

    /**
     * Vérifie si l'objectif de 8h de travail est atteint
     * @param {number} duration - Durée en millisecondes
     * @returns {boolean} true si >= 8h
     */
    isWorkDayComplete(duration) {
        return duration >= WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
    }

    /**
     * Calcule le temps restant pour atteindre l'objectif de 8h
     * @param {number} duration - Durée actuelle en millisecondes
     * @returns {number} Temps restant en millisecondes (0 si objectif atteint)
     */
    getRemainingTime(duration) {
        const target = WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
        return Math.max(0, target - duration);
    }

    /**
     * Calcule le temps total de toutes les pauses
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {number} Durée totale des pauses en millisecondes
     */
    calculateBreaksDuration(entries) {
        const breakPairs = this.#getBreakPairs(entries);
        let totalDuration = 0;

        for (const pair of breakPairs) {
            if (pair.end) {
                // Pause terminée
                totalDuration += pair.end.timestamp.getTime() - pair.start.timestamp.getTime();
            } else {
                // Pause en cours
                totalDuration += Date.now() - pair.start.timestamp.getTime();
            }
        }

        return totalDuration;
    }

    /**
     * Calcule le temps de pause déjeuner (compatibilité)
     * @deprecated Utiliser calculateBreaksDuration à la place
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {number} Durée de la pause en millisecondes
     */
    calculateLunchDuration(entries) {
        return this.calculateBreaksDuration(entries);
    }

    /**
     * Détermine l'état actuel de la journée
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {string} État de la journée (DayStatus)
     */
    getDayStatus(entries) {
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
        const breakPairs = this.#getBreakPairs(entries);
        const hasOpenBreak = breakPairs.some(pair => pair.end === null);

        if (hasOpenBreak) {
            return DayStatus.LUNCH; // Réutiliser LUNCH pour "en pause"
        }

        // On est en train de travailler (mais pas en pause)
        // Garder MORNING ou AFTERNOON pour compatibilité
        const hasAnyBreak = breakPairs.length > 0;
        return hasAnyBreak ? DayStatus.AFTERNOON : DayStatus.MORNING;
    }

    /**
     * Détermine quel bouton doit être activé en fonction de l'état du jour
     * @deprecated Utiliser getEnabledButtons pour supporter plusieurs pauses
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {string|null} Type du prochain pointage attendu ou null si journée terminée
     */
    getNextExpectedEntry(entries) {
        const enabled = this.getEnabledButtons(entries);
        return enabled.length > 0 ? enabled[0] : null;
    }

    /**
     * Détermine tous les boutons qui doivent être activés
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {string[]} Liste des types de pointages disponibles
     */
    getEnabledButtons(entries) {
        const status = this.getDayStatus(entries);
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
    }

    /**
     * Convertit une durée en millisecondes en objet heures/minutes
     * @param {number} milliseconds - Durée en millisecondes
     * @returns {Object} {hours: number, minutes: number}
     */
    msToHoursMinutes(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / MILLISECONDS_PER_MINUTE);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { hours, minutes };
    }

    /**
     * Calcule le pourcentage de l'objectif de 8h atteint
     * @param {number} duration - Durée actuelle en millisecondes
     * @returns {number} Pourcentage (0-100, peut dépasser 100)
     */
    getCompletionPercentage(duration) {
        const target = WORK_DAY_HOURS * MILLISECONDS_PER_HOUR;
        return Math.round((duration / target) * 100);
    }

    // ======================
    // Méthodes pour les projets
    // ======================

    /**
     * Calcule le temps total passé sur un projet pour une liste de sessions
     * @param {ProjectSession[]} sessions - Liste des sessions du projet
     * @param {boolean} includeRunning - Inclure la session en cours dans le calcul
     * @returns {number} Durée totale en millisecondes
     */
    calculateProjectTime(sessions, includeRunning = true) {
        if (!sessions || sessions.length === 0) {
            return 0;
        }

        return sessions.reduce((total, session) => {
            if (!includeRunning && session.isRunning()) {
                return total;
            }
            return total + session.getDuration();
        }, 0);
    }

    /**
     * Calcule le temps passé par projet pour une journée
     * @param {ProjectSession[]} sessions - Liste des sessions de la journée
     * @param {Project[]} projects - Liste des projets
     * @returns {Object[]} Liste d'objets {projectId, projectName, duration, percentage, overlapDuration}
     */
    calculateProjectStats(sessions, projects) {
        if (!sessions || sessions.length === 0) {
            return [];
        }

        // Grouper les sessions par projet
        const sessionsByProject = {};

        sessions.forEach(session => {
            if (!sessionsByProject[session.projectId]) {
                sessionsByProject[session.projectId] = [];
            }
            sessionsByProject[session.projectId].push(session);
        });

        // Calculer le temps total de toutes les sessions
        const totalTime = sessions.reduce((sum, session) => sum + session.getDuration(), 0);

        // Calculer les chevauchements
        const overlaps = this.calculateOverlaps(sessions);

        // Créer les statistiques par projet
        const stats = [];

        Object.keys(sessionsByProject).forEach(projectId => {
            const project = projects.find(p => p.id === projectId);
            const projectSessions = sessionsByProject[projectId];
            const duration = this.calculateProjectTime(projectSessions);
            const percentage = totalTime > 0 ? Math.round((duration / totalTime) * 100) : 0;

            // Calculer le temps de chevauchement pour ce projet
            const overlapDuration = this.calculateOverlapForProject(projectSessions, sessions);

            stats.push({
                projectId,
                projectName: project ? project.name : 'Projet inconnu',
                duration,
                percentage,
                isRunning: projectSessions.some(s => s.isRunning()),
                overlapDuration, // Nouveau : temps passé en parallèle avec d'autres projets
                hasOverlap: overlapDuration > 0
            });
        });

        // Trier par durée décroissante
        stats.sort((a, b) => b.duration - a.duration);

        return stats;
    }

    /**
     * Calcule toutes les périodes de chevauchement entre sessions
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @returns {Object[]} Liste des chevauchements {start, end, sessions}
     */
    calculateOverlaps(sessions) {
        if (!sessions || sessions.length < 2) {
            return [];
        }

        const overlaps = [];

        // Comparer chaque paire de sessions
        for (let i = 0; i < sessions.length; i++) {
            for (let j = i + 1; j < sessions.length; j++) {
                const session1 = sessions[i];
                const session2 = sessions[j];

                // Obtenir les temps de début et de fin
                const start1 = session1.startTime.getTime();
                const end1 = session1.endTime ? session1.endTime.getTime() : Date.now();
                const start2 = session2.startTime.getTime();
                const end2 = session2.endTime ? session2.endTime.getTime() : Date.now();

                // Vérifier s'il y a chevauchement
                const overlapStart = Math.max(start1, start2);
                const overlapEnd = Math.min(end1, end2);

                if (overlapStart < overlapEnd) {
                    overlaps.push({
                        start: new Date(overlapStart),
                        end: new Date(overlapEnd),
                        duration: overlapEnd - overlapStart,
                        sessions: [session1, session2]
                    });
                }
            }
        }

        return overlaps;
    }

    /**
     * Calcule le temps de chevauchement pour un projet spécifique
     * @param {ProjectSession[]} projectSessions - Sessions du projet
     * @param {ProjectSession[]} allSessions - Toutes les sessions
     * @returns {number} Durée totale de chevauchement en ms
     */
    calculateOverlapForProject(projectSessions, allSessions) {
        let totalOverlap = 0;

        projectSessions.forEach(session => {
            // Trouver les autres sessions qui chevauchent celle-ci
            const otherSessions = allSessions.filter(s =>
                s.id !== session.id && s.projectId !== session.projectId
            );

            otherSessions.forEach(otherSession => {
                const start1 = session.startTime.getTime();
                const end1 = session.endTime ? session.endTime.getTime() : Date.now();
                const start2 = otherSession.startTime.getTime();
                const end2 = otherSession.endTime ? otherSession.endTime.getTime() : Date.now();

                const overlapStart = Math.max(start1, start2);
                const overlapEnd = Math.min(end1, end2);

                if (overlapStart < overlapEnd) {
                    totalOverlap += (overlapEnd - overlapStart);
                }
            });
        });

        return totalOverlap;
    }

    /**
     * Calcule le temps total de chevauchement pour toutes les sessions
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @returns {number} Durée totale de chevauchement en ms (sans double comptage)
     */
    calculateTotalOverlapTime(sessions) {
        const overlaps = this.calculateOverlaps(sessions);
        if (overlaps.length === 0) return 0;

        // Fusionner les périodes qui se chevauchent pour éviter le double comptage
        const sortedOverlaps = overlaps.sort((a, b) => a.start.getTime() - b.start.getTime());
        const mergedPeriods = [];

        sortedOverlaps.forEach(overlap => {
            const last = mergedPeriods[mergedPeriods.length - 1];
            if (last && overlap.start.getTime() <= last.end.getTime()) {
                // Fusionner avec la période précédente
                last.end = new Date(Math.max(last.end.getTime(), overlap.end.getTime()));
            } else {
                // Nouvelle période
                mergedPeriods.push({ start: overlap.start, end: overlap.end });
            }
        });

        // Calculer le temps total
        return mergedPeriods.reduce((total, period) =>
            total + (period.end.getTime() - period.start.getTime()), 0);
    }

    /**
     * Calcule le temps total de toutes les sessions
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @returns {number} Durée totale en millisecondes
     */
    calculateTotalProjectTime(sessions) {
        if (!sessions || sessions.length === 0) {
            return 0;
        }

        return sessions.reduce((total, session) => total + session.getDuration(), 0);
    }
}
