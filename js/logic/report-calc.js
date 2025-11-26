'use strict';

import { formatDate } from '../utils.js';
import { calculatePresenceTime, calculateTotalProjectTime, isWorkDayComplete } from './calculator.js';

/**
 * Constantes pour les périodes
 */
export const PeriodType = Object.freeze({
    WEEK: 'week',
    MONTH: 'month',
    CUSTOM: 'custom'
});

// ======================
// Calculs de périodes (fonctions pures)
// ======================

/**
 * Obtient la date de début de la semaine (lundi)
 * @param {Date} date - Date de référence
 * @returns {Date} Date du lundi de cette semaine
 */
export const getWeekStart = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtient la date de fin de la semaine (dimanche)
 * @param {Date} date - Date de référence
 * @returns {Date} Date du dimanche de cette semaine
 */
export const getWeekEnd = (date = new Date()) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
};

/**
 * Obtient la date de début du mois
 * @param {Date} date - Date de référence
 * @returns {Date} Premier jour du mois
 */
export const getMonthStart = (date = new Date()) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * Obtient la date de fin du mois
 * @param {Date} date - Date de référence
 * @returns {Date} Dernier jour du mois
 */
export const getMonthEnd = (date = new Date()) => {
    const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Génère un tableau de dates pour une période
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Array<string>} Tableau de dates au format YYYY-MM-DD
 */
export const generateDateRange = (startDate, endDate) => {
    const dates = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};

/**
 * Obtient la semaine précédente
 * @param {Date} date - Date de référence
 * @returns {Object} {start: Date, end: Date}
 */
export const getPreviousWeek = (date = new Date()) => {
    const currentWeekStart = getWeekStart(date);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    return {
        start: previousWeekStart,
        end: getWeekEnd(previousWeekStart)
    };
};

/**
 * Obtient la semaine suivante
 * @param {Date} date - Date de référence
 * @returns {Object} {start: Date, end: Date}
 */
export const getNextWeek = (date = new Date()) => {
    const currentWeekStart = getWeekStart(date);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    return {
        start: nextWeekStart,
        end: getWeekEnd(nextWeekStart)
    };
};

/**
 * Obtient le mois précédent
 * @param {Date} date - Date de référence
 * @returns {Object} {start: Date, end: Date}
 */
export const getPreviousMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);

    return {
        start: getMonthStart(d),
        end: getMonthEnd(d)
    };
};

/**
 * Obtient le mois suivant
 * @param {Date} date - Date de référence
 * @returns {Object} {start: Date, end: Date}
 */
export const getNextMonth = (date = new Date()) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + 1);

    return {
        start: getMonthStart(d),
        end: getMonthEnd(d)
    };
};

// ======================
// Calculs de rapports (fonctions pures)
// ======================

/**
 * Calcule les statistiques pour un jour
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {Array} allEntries - Toutes les entrées
 * @param {Array} allSessions - Toutes les sessions
 * @returns {Object} Statistiques du jour
 */
const calculateDayStats = (date, allEntries, allSessions) => {
    const dayEntries = allEntries.filter(e => e.date === date);
    const daySessions = allSessions.filter(s => s.date === date);

    const presenceTime = calculatePresenceTime(dayEntries);
    const projectTime = calculateTotalProjectTime(daySessions);
    const isComplete = isWorkDayComplete(presenceTime);

    return {
        date,
        presenceTime,
        projectTime,
        isComplete,
        hasEntries: dayEntries.length > 0
    };
};

/**
 * Calcule les statistiques par projet pour une période
 * @param {Array} sessions - Sessions de la période
 * @param {Array} projects - Liste des projets
 * @returns {Array} Statistiques par projet
 */
const calculateProjectStatsForPeriod = (sessions, projects) => {
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

    // Calculer les stats par projet
    const stats = Object.keys(sessionsByProject).map(projectId => {
        const project = projects.find(p => p.id === projectId);
        const projectSessions = sessionsByProject[projectId];

        const totalTime = projectSessions.reduce((sum, session) => {
            const duration = session.endTime
                ? session.endTime.getTime() - session.startTime.getTime()
                : 0; // Ignorer les sessions en cours pour les rapports
            return sum + duration;
        }, 0);

        return {
            projectId,
            projectName: project ? project.name : 'Projet inconnu',
            totalTime,
            sessionCount: projectSessions.length
        };
    });

    // Trier par temps total décroissant
    return stats.sort((a, b) => b.totalTime - a.totalTime);
};

/**
 * Calcule les statistiques pour une période donnée
 * @param {Object} options - Options de calcul
 * @param {Date} options.startDate - Date de début
 * @param {Date} options.endDate - Date de fin
 * @param {Array} options.entries - Toutes les entrées de pointage
 * @param {Array} options.sessions - Toutes les sessions de projet
 * @param {Array} options.projects - Tous les projets
 * @returns {Object} Statistiques de la période
 */
export const calculatePeriodStats = ({ startDate, endDate, entries, sessions, projects }) => {
    const dateRange = generateDateRange(startDate, endDate);

    // Calculer les stats par jour
    const dailyStats = dateRange.map(date =>
        calculateDayStats(date, entries, sessions)
    );

    // Calculer les totaux
    const totalPresenceTime = dailyStats.reduce((sum, day) => sum + day.presenceTime, 0);
    const totalProjectTime = dailyStats.reduce((sum, day) => sum + day.projectTime, 0);
    const incompleteDays = dailyStats.filter(day => day.hasEntries && !day.isComplete);
    const completeDays = dailyStats.filter(day => day.isComplete);
    const workedDays = dailyStats.filter(day => day.hasEntries);

    // Calculer les stats par projet pour toute la période
    const periodSessions = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate <= endDate;
    });
    const projectStats = calculateProjectStatsForPeriod(periodSessions, projects);

    return {
        period: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            totalDays: dateRange.length,
            workedDays: workedDays.length,
            completeDays: completeDays.length,
            incompleteDays: incompleteDays.length
        },
        time: {
            totalPresence: totalPresenceTime,
            totalProject: totalProjectTime,
            averagePresencePerDay: workedDays.length > 0
                ? totalPresenceTime / workedDays.length
                : 0,
            averageProjectPerDay: workedDays.length > 0
                ? totalProjectTime / workedDays.length
                : 0
        },
        dailyStats,
        projectStats,
        incompleteDaysList: incompleteDays.map(day => ({
            date: day.date,
            presenceTime: day.presenceTime,
            missing: 28800000 - day.presenceTime // 8h en ms
        }))
    };
};

/**
 * Calcule les statistiques pour la semaine courante
 * @param {Date} date - Date de référence
 * @param {Array} entries - Toutes les entrées
 * @param {Array} sessions - Toutes les sessions
 * @param {Array} projects - Tous les projets
 * @returns {Object} Statistiques de la semaine
 */
export const calculateWeekStats = (date, entries, sessions, projects) => {
    const startDate = getWeekStart(date);
    const endDate = getWeekEnd(date);

    return calculatePeriodStats({
        startDate,
        endDate,
        entries,
        sessions,
        projects
    });
};

/**
 * Calcule les statistiques pour le mois courant
 * @param {Date} date - Date de référence
 * @param {Array} entries - Toutes les entrées
 * @param {Array} sessions - Toutes les sessions
 * @param {Array} projects - Tous les projets
 * @returns {Object} Statistiques du mois
 */
export const calculateMonthStats = (date, entries, sessions, projects) => {
    const startDate = getMonthStart(date);
    const endDate = getMonthEnd(date);

    return calculatePeriodStats({
        startDate,
        endDate,
        entries,
        sessions,
        projects
    });
};

/**
 * Formate le nom d'une période
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @param {string} type - Type de période
 * @returns {string} Nom formaté
 */
export const formatPeriodName = (startDate, endDate, type) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (type === PeriodType.WEEK) {
        const weekNumber = getWeekNumber(start);
        return `Semaine ${weekNumber} (${formatDate(start)} - ${formatDate(end)})`;
    }

    if (type === PeriodType.MONTH) {
        const monthName = start.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        return monthName.charAt(0).toUpperCase() + monthName.slice(1);
    }

    return `${formatDate(start)} - ${formatDate(end)}`;
};

/**
 * Calcule le numéro de semaine ISO 8601
 * @param {Date} date - Date
 * @returns {number} Numéro de semaine
 */
export const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNumber;
};
