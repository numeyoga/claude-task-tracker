'use strict';

import { formatDuration, formatTime, sanitizeForCSV } from './utils.js';

/**
 * Formats d'export disponibles
 */
export const ExportFormat = {
    CSV: 'csv',
    JSON: 'json'
};

/**
 * Types d'export disponibles
 */
export const ExportType = {
    TIME_ENTRIES: 'time_entries',
    PROJECT_SESSIONS: 'project_sessions',
    WEEKLY_REPORT: 'weekly_report',
    ALL_DATA: 'all_data'
};

/**
 * Service d'export de données
 */
export class DataExporter {
    // ======================
    // Export des pointages (TimeEntries)
    // ======================

    /**
     * Exporte les pointages en CSV
     * @param {TimeEntry[]} entries - Pointages à exporter
     * @returns {string} Données CSV
     */
    exportTimeEntriesToCSV(entries) {
        if (!entries || entries.length === 0) {
            return '';
        }

        // En-têtes
        const headers = ['Date', 'Heure', 'Type', 'Note'];
        let csv = headers.join(',') + '\n';

        // Lignes de données
        entries.forEach(entry => {
            const row = [
                sanitizeForCSV(entry.date),
                sanitizeForCSV(formatTime(entry.timestamp)),
                sanitizeForCSV(this.#getEntryTypeLabel(entry.type)),
                sanitizeForCSV(entry.note || '')
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Exporte les pointages en JSON
     * @param {TimeEntry[]} entries - Pointages à exporter
     * @returns {string} Données JSON
     */
    exportTimeEntriesToJSON(entries) {
        const data = entries.map(entry => ({
            id: entry.id,
            date: entry.date,
            time: formatTime(entry.timestamp),
            timestamp: entry.timestamp.toISOString(),
            type: entry.type,
            typeLabel: this.#getEntryTypeLabel(entry.type),
            note: entry.note || ''
        }));

        return JSON.stringify(data, null, 2);
    }

    // ======================
    // Export des sessions de projet
    // ======================

    /**
     * Exporte les sessions de projet en CSV
     * @param {ProjectSession[]} sessions - Sessions à exporter
     * @param {Project[]} projects - Projets pour récupérer les noms
     * @returns {string} Données CSV
     */
    exportProjectSessionsToCSV(sessions, projects) {
        if (!sessions || sessions.length === 0) {
            return '';
        }

        // En-têtes
        const headers = ['Date', 'Projet', 'Début', 'Fin', 'Durée', 'Note'];
        let csv = headers.join(',') + '\n';

        // Lignes de données
        sessions.forEach(session => {
            const project = projects.find(p => p.id === session.projectId);
            const row = [
                sanitizeForCSV(session.date),
                sanitizeForCSV(project ? project.name : 'Projet inconnu'),
                sanitizeForCSV(formatTime(session.startTime)),
                sanitizeForCSV(session.endTime ? formatTime(session.endTime) : 'En cours'),
                sanitizeForCSV(formatDuration(session.getDuration())),
                sanitizeForCSV(session.note || '')
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    }

    /**
     * Exporte les sessions de projet en JSON
     * @param {ProjectSession[]} sessions - Sessions à exporter
     * @param {Project[]} projects - Projets pour récupérer les noms
     * @returns {string} Données JSON
     */
    exportProjectSessionsToJSON(sessions, projects) {
        const data = sessions.map(session => {
            const project = projects.find(p => p.id === session.projectId);
            return {
                id: session.id,
                projectId: session.projectId,
                projectName: project ? project.name : 'Projet inconnu',
                date: session.date,
                startTime: formatTime(session.startTime),
                endTime: session.endTime ? formatTime(session.endTime) : null,
                duration: session.getDuration(),
                durationFormatted: formatDuration(session.getDuration()),
                note: session.note || '',
                isRunning: session.isRunning()
            };
        });

        return JSON.stringify(data, null, 2);
    }

    // ======================
    // Export des rapports hebdomadaires
    // ======================

    /**
     * Exporte un rapport hebdomadaire en CSV
     * @param {Object} report - Rapport hebdomadaire généré par WeeklyReportCalculator
     * @returns {string} Données CSV
     */
    exportWeeklyReportToCSV(report) {
        let csv = '';

        // Section 1: Informations sur la période
        csv += 'Rapport de la période\n';
        csv += `Début,${sanitizeForCSV(report.period.startDate)}\n`;
        csv += `Fin,${sanitizeForCSV(report.period.endDate)}\n`;
        csv += `Jours travaillés,${report.period.workedDays}\n`;
        csv += `Jours complets,${report.period.completeDays}\n`;
        csv += `Jours incomplets,${report.period.incompleteDays}\n`;
        csv += '\n';

        // Section 2: Temps total
        csv += 'Temps total\n';
        csv += `Présence,${sanitizeForCSV(formatDuration(report.time.totalPresence))}\n`;
        csv += `Projets,${sanitizeForCSV(formatDuration(report.time.totalProject))}\n`;
        csv += `Moyenne présence/jour,${sanitizeForCSV(formatDuration(report.time.averagePresencePerDay))}\n`;
        csv += `Moyenne projets/jour,${sanitizeForCSV(formatDuration(report.time.averageProjectPerDay))}\n`;
        csv += '\n';

        // Section 3: Temps par projet
        csv += 'Temps par projet\n';
        csv += 'Projet,Durée,Pourcentage,Sessions\n';
        report.projectStats.forEach(stat => {
            csv += `${sanitizeForCSV(stat.projectName)},${sanitizeForCSV(formatDuration(stat.duration))},${stat.percentage}%,${stat.sessionCount}\n`;
        });
        csv += '\n';

        // Section 4: Statistiques quotidiennes
        csv += 'Statistiques quotidiennes\n';
        csv += 'Date,Présence,Projets,Complet\n';
        report.dailyStats.forEach(day => {
            csv += `${sanitizeForCSV(day.date)},${sanitizeForCSV(formatDuration(day.presenceTime))},${sanitizeForCSV(formatDuration(day.projectTime))},${day.isComplete ? 'Oui' : 'Non'}\n`;
        });
        csv += '\n';

        // Section 5: Jours incomplets
        if (report.incompleteDaysList.length > 0) {
            csv += 'Jours incomplets\n';
            csv += 'Date,Temps présence,Temps manquant\n';
            report.incompleteDaysList.forEach(day => {
                csv += `${sanitizeForCSV(day.date)},${sanitizeForCSV(formatDuration(day.presenceTime))},${sanitizeForCSV(formatDuration(day.missingTime))}\n`;
            });
        }

        return csv;
    }

    /**
     * Exporte un rapport hebdomadaire en JSON
     * @param {Object} report - Rapport hebdomadaire généré par WeeklyReportCalculator
     * @returns {string} Données JSON
     */
    exportWeeklyReportToJSON(report) {
        // Formater les durées pour une meilleure lisibilité
        const formattedReport = {
            period: report.period,
            time: {
                totalPresence: {
                    milliseconds: report.time.totalPresence,
                    formatted: formatDuration(report.time.totalPresence)
                },
                totalProject: {
                    milliseconds: report.time.totalProject,
                    formatted: formatDuration(report.time.totalProject)
                },
                averagePresencePerDay: {
                    milliseconds: report.time.averagePresencePerDay,
                    formatted: formatDuration(report.time.averagePresencePerDay)
                },
                averageProjectPerDay: {
                    milliseconds: report.time.averageProjectPerDay,
                    formatted: formatDuration(report.time.averageProjectPerDay)
                }
            },
            projectStats: report.projectStats.map(stat => ({
                ...stat,
                durationFormatted: formatDuration(stat.duration),
                averageSessionDurationFormatted: formatDuration(stat.averageSessionDuration)
            })),
            dailyStats: report.dailyStats.map(day => ({
                ...day,
                presenceTimeFormatted: formatDuration(day.presenceTime),
                projectTimeFormatted: formatDuration(day.projectTime)
            })),
            incompleteDays: report.incompleteDaysList.map(day => ({
                ...day,
                presenceTimeFormatted: formatDuration(day.presenceTime),
                missingTimeFormatted: formatDuration(day.missingTime)
            }))
        };

        return JSON.stringify(formattedReport, null, 2);
    }

    // ======================
    // Export de toutes les données
    // ======================

    /**
     * Exporte toutes les données de l'application en JSON
     * @param {Object} data - Toutes les données
     * @param {TimeEntry[]} data.entries - Tous les pointages
     * @param {Project[]} data.projects - Tous les projets
     * @param {ProjectSession[]} data.sessions - Toutes les sessions
     * @returns {string} Données JSON
     */
    exportAllDataToJSON({ entries, projects, sessions }) {
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '2.0.0',
            data: {
                timeEntries: entries.map(e => e.toJSON()),
                projects: projects.map(p => p.toJSON()),
                projectSessions: sessions.map(s => s.toJSON())
            }
        };

        return JSON.stringify(exportData, null, 2);
    }

    // ======================
    // Téléchargement de fichiers
    // ======================

    /**
     * Déclenche le téléchargement d'un fichier
     * @param {string} content - Contenu du fichier
     * @param {string} filename - Nom du fichier
     * @param {string} mimeType - Type MIME du fichier
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Exporte et télécharge des données
     * @param {Object} options - Options d'export
     * @param {string} options.type - Type d'export (ExportType)
     * @param {string} options.format - Format d'export (ExportFormat)
     * @param {Object} options.data - Données à exporter
     * @param {string} [options.filename] - Nom du fichier (optionnel)
     */
    exportAndDownload({ type, format, data, filename }) {
        let content = '';
        let defaultFilename = '';
        let mimeType = '';

        const timestamp = new Date().toISOString().split('T')[0];

        switch (type) {
            case ExportType.TIME_ENTRIES:
                if (format === ExportFormat.CSV) {
                    content = this.exportTimeEntriesToCSV(data.entries);
                    defaultFilename = `pointages_${timestamp}.csv`;
                    mimeType = 'text/csv;charset=utf-8;';
                } else {
                    content = this.exportTimeEntriesToJSON(data.entries);
                    defaultFilename = `pointages_${timestamp}.json`;
                    mimeType = 'application/json;charset=utf-8;';
                }
                break;

            case ExportType.PROJECT_SESSIONS:
                if (format === ExportFormat.CSV) {
                    content = this.exportProjectSessionsToCSV(data.sessions, data.projects);
                    defaultFilename = `sessions_${timestamp}.csv`;
                    mimeType = 'text/csv;charset=utf-8;';
                } else {
                    content = this.exportProjectSessionsToJSON(data.sessions, data.projects);
                    defaultFilename = `sessions_${timestamp}.json`;
                    mimeType = 'application/json;charset=utf-8;';
                }
                break;

            case ExportType.WEEKLY_REPORT:
                if (format === ExportFormat.CSV) {
                    content = this.exportWeeklyReportToCSV(data.report);
                    defaultFilename = `rapport_${timestamp}.csv`;
                    mimeType = 'text/csv;charset=utf-8;';
                } else {
                    content = this.exportWeeklyReportToJSON(data.report);
                    defaultFilename = `rapport_${timestamp}.json`;
                    mimeType = 'application/json;charset=utf-8;';
                }
                break;

            case ExportType.ALL_DATA:
                content = this.exportAllDataToJSON(data);
                defaultFilename = `claude_time_tracker_backup_${timestamp}.json`;
                mimeType = 'application/json;charset=utf-8;';
                break;

            default:
                throw new Error(`Type d'export inconnu: ${type}`);
        }

        if (!content) {
            throw new Error('Aucune donnée à exporter');
        }

        this.downloadFile(content, filename || defaultFilename, mimeType);
    }

    // ======================
    // Méthodes utilitaires privées
    // ======================

    /**
     * Récupère le libellé d'un type de pointage
     * @param {string} type - Type de pointage
     * @returns {string} Libellé
     * @private
     */
    #getEntryTypeLabel(type) {
        const labels = {
            'clock-in': 'Arrivée',
            'lunch-start': 'Début pause',
            'lunch-end': 'Fin pause',
            'clock-out': 'Départ'
        };
        return labels[type] || type;
    }
}
