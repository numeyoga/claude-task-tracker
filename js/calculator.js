'use strict';

import { ENTRY_TYPES } from './time-entry.js';

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
     * Formule: (lunch-start - clock-in) + (clock-out - lunch-end)
     * @param {TimeEntry[]} entries - Liste des pointages du jour (triés par timestamp)
     * @returns {number} Durée en millisecondes
     * @throws {Error} Si les pointages sont incomplets ou invalides
     */
    calculatePresenceTime(entries) {
        if (!entries || entries.length === 0) {
            return 0;
        }

        // Récupérer les pointages par type
        const clockIn = entries.find(e => e.type === ENTRY_TYPES.CLOCK_IN);
        const lunchStart = entries.find(e => e.type === ENTRY_TYPES.LUNCH_START);
        const lunchEnd = entries.find(e => e.type === ENTRY_TYPES.LUNCH_END);
        const clockOut = entries.find(e => e.type === ENTRY_TYPES.CLOCK_OUT);

        // Calculer en fonction des pointages disponibles
        let totalTime = 0;

        if (clockIn) {
            if (clockOut) {
                // Journée complète: du clock-in au clock-out
                totalTime = clockOut.timestamp.getTime() - clockIn.timestamp.getTime();

                // Soustraire le temps de pause si présent
                if (lunchStart && lunchEnd) {
                    const lunchDuration = lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime();
                    totalTime -= lunchDuration;
                }
            } else if (lunchStart) {
                // En cours: du clock-in au lunch-start (matin) ou jusqu'à maintenant (après-midi)
                if (lunchEnd) {
                    // Après-midi en cours: matin + depuis la fin de la pause
                    const morningTime = lunchStart.timestamp.getTime() - clockIn.timestamp.getTime();
                    const afternoonTime = Date.now() - lunchEnd.timestamp.getTime();
                    totalTime = morningTime + afternoonTime;
                } else {
                    // Pause en cours: seulement le temps du matin
                    totalTime = lunchStart.timestamp.getTime() - clockIn.timestamp.getTime();
                }
            } else {
                // Matin en cours: du clock-in à maintenant
                totalTime = Date.now() - clockIn.timestamp.getTime();
            }
        }

        return Math.max(0, totalTime);
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
     * Calcule le temps de pause déjeuner
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {number} Durée de la pause en millisecondes
     */
    calculateLunchDuration(entries) {
        const lunchStart = entries.find(e => e.type === ENTRY_TYPES.LUNCH_START);
        const lunchEnd = entries.find(e => e.type === ENTRY_TYPES.LUNCH_END);

        if (!lunchStart) {
            return 0;
        }

        if (lunchEnd) {
            // Pause terminée
            return lunchEnd.timestamp.getTime() - lunchStart.timestamp.getTime();
        } else {
            // Pause en cours
            return Date.now() - lunchStart.timestamp.getTime();
        }
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
        const hasLunchStart = entries.some(e => e.type === ENTRY_TYPES.LUNCH_START);
        const hasLunchEnd = entries.some(e => e.type === ENTRY_TYPES.LUNCH_END);
        const hasClockOut = entries.some(e => e.type === ENTRY_TYPES.CLOCK_OUT);

        if (hasClockOut) {
            return DayStatus.COMPLETED;
        }

        if (hasLunchEnd) {
            return DayStatus.AFTERNOON;
        }

        if (hasLunchStart) {
            return DayStatus.LUNCH;
        }

        if (hasClockIn) {
            return DayStatus.MORNING;
        }

        return DayStatus.NOT_STARTED;
    }

    /**
     * Détermine quel bouton doit être activé en fonction de l'état du jour
     * @param {TimeEntry[]} entries - Liste des pointages du jour
     * @returns {string|null} Type du prochain pointage attendu ou null si journée terminée
     */
    getNextExpectedEntry(entries) {
        const status = this.getDayStatus(entries);

        switch (status) {
            case DayStatus.NOT_STARTED:
                return ENTRY_TYPES.CLOCK_IN;
            case DayStatus.MORNING:
                return ENTRY_TYPES.LUNCH_START;
            case DayStatus.LUNCH:
                return ENTRY_TYPES.LUNCH_END;
            case DayStatus.AFTERNOON:
                return ENTRY_TYPES.CLOCK_OUT;
            case DayStatus.COMPLETED:
                return null;
            default:
                return null;
        }
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
     * @returns {Object[]} Liste d'objets {projectId, projectName, duration, percentage}
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

        // Créer les statistiques par projet
        const stats = [];

        Object.keys(sessionsByProject).forEach(projectId => {
            const project = projects.find(p => p.id === projectId);
            const projectSessions = sessionsByProject[projectId];
            const duration = this.calculateProjectTime(projectSessions);
            const percentage = totalTime > 0 ? Math.round((duration / totalTime) * 100) : 0;

            stats.push({
                projectId,
                projectName: project ? project.name : 'Projet inconnu',
                duration,
                percentage,
                isRunning: projectSessions.some(s => s.isRunning())
            });
        });

        // Trier par durée décroissante
        stats.sort((a, b) => b.duration - a.duration);

        return stats;
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
