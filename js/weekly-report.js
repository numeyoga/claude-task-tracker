'use strict';

import { TimeCalculator } from './calculator.js';

/**
 * Constantes pour les périodes
 */
export const PeriodType = {
    WEEK: 'week',
    MONTH: 'month',
    CUSTOM: 'custom'
};

/**
 * Service de calcul des rapports hebdomadaires et mensuels
 */
export class WeeklyReportCalculator {
    constructor() {
        this.calculator = new TimeCalculator();
    }

    // ======================
    // Calculs de périodes
    // ======================

    /**
     * Obtient la date de début de la semaine (lundi)
     * @param {Date} date - Date de référence
     * @returns {Date} Date du lundi de cette semaine
     */
    getWeekStart(date = new Date()) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = début de semaine
        return new Date(d.setDate(diff));
    }

    /**
     * Obtient la date de fin de la semaine (dimanche)
     * @param {Date} date - Date de référence
     * @returns {Date} Date du dimanche de cette semaine
     */
    getWeekEnd(date = new Date()) {
        const start = this.getWeekStart(date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return end;
    }

    /**
     * Obtient la date de début du mois
     * @param {Date} date - Date de référence
     * @returns {Date} Premier jour du mois
     */
    getMonthStart(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    /**
     * Obtient la date de fin du mois
     * @param {Date} date - Date de référence
     * @returns {Date} Dernier jour du mois
     */
    getMonthEnd(date = new Date()) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }

    /**
     * Génère un tableau de dates pour une période
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {string[]} Tableau de dates au format YYYY-MM-DD
     */
    generateDateRange(startDate, endDate) {
        const dates = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            dates.push(this.#formatDate(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    // ======================
    // Calculs de rapports
    // ======================

    /**
     * Calcule les statistiques pour une période donnée
     * @param {Object} options - Options de calcul
     * @param {Date} options.startDate - Date de début
     * @param {Date} options.endDate - Date de fin
     * @param {TimeEntry[]} options.entries - Toutes les entrées de pointage
     * @param {ProjectSession[]} options.sessions - Toutes les sessions de projet
     * @param {Project[]} options.projects - Tous les projets
     * @returns {Object} Statistiques de la période
     */
    calculatePeriodStats({ startDate, endDate, entries, sessions, projects }) {
        const dateRange = this.generateDateRange(startDate, endDate);

        // Calculer les stats par jour
        const dailyStats = dateRange.map(date => {
            const dayEntries = entries.filter(e => e.date === date);
            const daySessions = sessions.filter(s => s.date === date);

            const presenceTime = this.calculator.calculatePresenceTime(dayEntries);
            const projectTime = this.calculator.calculateTotalProjectTime(daySessions);
            const isComplete = this.calculator.isWorkDayComplete(presenceTime);

            return {
                date,
                presenceTime,
                projectTime,
                isComplete,
                hasEntries: dayEntries.length > 0
            };
        });

        // Calculer les totaux
        const totalPresenceTime = dailyStats.reduce((sum, day) => sum + day.presenceTime, 0);
        const totalProjectTime = dailyStats.reduce((sum, day) => sum + day.projectTime, 0);
        const incompleteDays = dailyStats.filter(day => day.hasEntries && !day.isComplete);
        const completeDays = dailyStats.filter(day => day.isComplete);
        const workedDays = dailyStats.filter(day => day.hasEntries);

        // Calculer les stats par projet
        const projectStats = this.#calculateProjectStatsForPeriod(sessions, projects);

        return {
            period: {
                startDate: this.#formatDate(startDate),
                endDate: this.#formatDate(endDate),
                totalDays: dateRange.length,
                workedDays: workedDays.length,
                completeDays: completeDays.length,
                incompleteDays: incompleteDays.length
            },
            time: {
                totalPresence: totalPresenceTime,
                totalProject: totalProjectTime,
                averagePresencePerDay: workedDays.length > 0 ? totalPresenceTime / workedDays.length : 0,
                averageProjectPerDay: workedDays.length > 0 ? totalProjectTime / workedDays.length : 0
            },
            dailyStats,
            projectStats,
            incompleteDaysList: incompleteDays.map(day => ({
                date: day.date,
                presenceTime: day.presenceTime,
                missingTime: this.calculator.getRemainingTime(day.presenceTime)
            }))
        };
    }

    /**
     * Calcule les statistiques par projet pour une période
     * @param {ProjectSession[]} sessions - Sessions de la période
     * @param {Project[]} projects - Tous les projets
     * @returns {Object[]} Stats par projet
     * @private
     */
    #calculateProjectStatsForPeriod(sessions, projects) {
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

        // Calculer le temps total
        const totalTime = sessions.reduce((sum, session) => sum + session.getDuration(), 0);

        // Créer les statistiques par projet
        const stats = Object.keys(sessionsByProject).map(projectId => {
            const project = projects.find(p => p.id === projectId);
            const projectSessions = sessionsByProject[projectId];
            const duration = projectSessions.reduce((sum, s) => sum + s.getDuration(), 0);
            const percentage = totalTime > 0 ? Math.round((duration / totalTime) * 100) : 0;
            const sessionCount = projectSessions.length;

            return {
                projectId,
                projectName: project ? project.name : 'Projet inconnu',
                projectColor: project ? project.color : '#6b7280',
                duration,
                percentage,
                sessionCount,
                averageSessionDuration: sessionCount > 0 ? duration / sessionCount : 0
            };
        });

        // Trier par durée décroissante
        stats.sort((a, b) => b.duration - a.duration);

        return stats;
    }

    /**
     * Génère des données pour un graphique en barres (temps par jour)
     * @param {Object[]} dailyStats - Statistiques quotidiennes
     * @returns {Object} Données pour le graphique
     */
    generateDailyChart(dailyStats) {
        return {
            labels: dailyStats.map(day => this.#formatDateShort(new Date(day.date))),
            presenceData: dailyStats.map(day => day.presenceTime / (1000 * 60 * 60)), // En heures
            projectData: dailyStats.map(day => day.projectTime / (1000 * 60 * 60)), // En heures
            completionStatus: dailyStats.map(day => day.isComplete)
        };
    }

    /**
     * Génère des données pour un graphique en camembert (temps par projet)
     * @param {Object[]} projectStats - Statistiques par projet
     * @returns {Object} Données pour le graphique
     */
    generateProjectPieChart(projectStats) {
        return {
            labels: projectStats.map(p => p.projectName),
            data: projectStats.map(p => p.duration / (1000 * 60 * 60)), // En heures
            percentages: projectStats.map(p => p.percentage),
            colors: projectStats.map(p => p.projectColor)
        };
    }

    // ======================
    // Méthodes utilitaires
    // ======================

    /**
     * Formate une date en YYYY-MM-DD
     * @param {Date} date - Date à formater
     * @returns {string} Date formatée
     * @private
     */
    #formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Formate une date en format court (ex: "Lun 13")
     * @param {Date} date - Date à formater
     * @returns {string} Date formatée
     * @private
     */
    #formatDateShort(date) {
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
        return `${days[date.getDay()]} ${date.getDate()}`;
    }

    /**
     * Obtient le nom du mois en français
     * @param {Date} date - Date
     * @returns {string} Nom du mois
     */
    getMonthName(date) {
        const months = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        return months[date.getMonth()];
    }

    /**
     * Formate une plage de dates
     * @param {Date} startDate - Date de début
     * @param {Date} endDate - Date de fin
     * @returns {string} Plage formatée (ex: "13-19 Nov 2025")
     */
    formatDateRange(startDate, endDate) {
        const sameMonth = startDate.getMonth() === endDate.getMonth();
        const sameYear = startDate.getFullYear() === endDate.getFullYear();

        if (sameMonth && sameYear) {
            return `${startDate.getDate()}-${endDate.getDate()} ${this.getMonthName(startDate).substring(0, 3)} ${startDate.getFullYear()}`;
        } else if (sameYear) {
            return `${startDate.getDate()} ${this.getMonthName(startDate).substring(0, 3)} - ${endDate.getDate()} ${this.getMonthName(endDate).substring(0, 3)} ${startDate.getFullYear()}`;
        } else {
            return `${startDate.getDate()} ${this.getMonthName(startDate).substring(0, 3)} ${startDate.getFullYear()} - ${endDate.getDate()} ${this.getMonthName(endDate).substring(0, 3)} ${endDate.getFullYear()}`;
        }
    }
}
