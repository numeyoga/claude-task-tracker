'use strict';

import { formatDuration, createElement } from './utils.js';

/**
 * Gestion de l'interface utilisateur des rapports
 */
export class ReportsUI {
    constructor() {
        // Éléments du DOM
        this.periodLabel = null;
        this.reportTotalPresence = null;
        this.reportTotalProject = null;
        this.reportWorkedDays = null;
        this.weeklyTable = null;
        this.periodWeekBtn = null;
        this.periodMonthBtn = null;
        this.periodPrevBtn = null;
        this.periodNextBtn = null;

        // Callbacks
        this.onPeriodTypeChange = null;
        this.onPeriodNavigate = null;
    }

    /**
     * Initialise les éléments du DOM
     */
    init() {
        // Récupérer les éléments du DOM
        this.periodLabel = document.getElementById('period-label');
        this.reportTotalPresence = document.getElementById('report-total-presence');
        this.reportTotalProject = document.getElementById('report-total-project');
        this.reportWorkedDays = document.getElementById('report-worked-days');
        this.weeklyTable = document.getElementById('weekly-table');
        this.periodWeekBtn = document.getElementById('period-week-btn');
        this.periodMonthBtn = document.getElementById('period-month-btn');
        this.periodPrevBtn = document.getElementById('period-prev-btn');
        this.periodNextBtn = document.getElementById('period-next-btn');

        // Configurer les event listeners
        this.#setupEventListeners();

        console.log('✅ ReportsUI initialisée');
    }

    // ======================
    // Mise à jour de l'interface
    // ======================

    /**
     * Met à jour le libellé de la période
     * @param {string} label - Libellé de la période (ex: "13-19 Nov 2025")
     */
    updatePeriodLabel(label) {
        if (this.periodLabel) {
            this.periodLabel.textContent = label;
        }
    }

    /**
     * Met à jour les statistiques globales
     * @param {Object} stats - Statistiques de la période
     */
    updateSummary(stats) {
        if (this.reportTotalPresence) {
            this.reportTotalPresence.textContent = formatDuration(stats.time.totalPresence);
        }

        if (this.reportTotalProject) {
            this.reportTotalProject.textContent = formatDuration(stats.time.totalProject);
        }

        if (this.reportWorkedDays) {
            this.reportWorkedDays.textContent = stats.period.workedDays;
        }

    }

    /**
     * Affiche le tableau hebdomadaire avec les projets et les jours
     * @param {Object} report - Rapport avec toutes les données
     * @param {string} periodType - Type de période ('week' ou 'month')
     */
    renderWeeklyTable(report, periodType = 'week') {
        if (!this.weeklyTable) return;

        // Vider le tableau
        this.weeklyTable.innerHTML = '';

        if (!report || !report.dailyStats || report.dailyStats.length === 0) {
            const emptyRow = createElement('tr');
            const emptyCell = createElement('td', { colspan: '7' }, 'Aucune donnée pour cette période');
            emptyRow.appendChild(emptyCell);
            this.weeklyTable.appendChild(emptyRow);
            return;
        }

        if (periodType === 'week') {
            this.#renderWeekView(report);
        } else {
            this.#renderMonthView(report);
        }
    }

    /**
     * Affiche le tableau pour une semaine (lundi à vendredi)
     * @param {Object} report - Rapport avec toutes les données
     * @private
     */
    #renderWeekView(report) {
        // Filtrer uniquement les jours de la semaine (lundi à vendredi)
        const weekDays = report.dailyStats.filter(day => {
            const date = new Date(day.date + 'T12:00:00');
            const dayOfWeek = date.getDay();
            return dayOfWeek >= 1 && dayOfWeek <= 5; // 1 = lundi, 5 = vendredi
        });

        if (weekDays.length === 0) {
            const emptyRow = createElement('tr');
            const emptyCell = createElement('td', { colspan: '7' }, 'Aucun jour de semaine dans cette période');
            emptyRow.appendChild(emptyCell);
            this.weeklyTable.appendChild(emptyRow);
            return;
        }

        // Créer l'en-tête du tableau
        const thead = createElement('thead');
        const headerRow = createElement('tr');

        // Colonne "Projet"
        const projectHeader = createElement('th', { class: 'weekly-table__header' }, 'Projet');
        headerRow.appendChild(projectHeader);

        // Colonnes pour chaque jour (lundi à vendredi)
        weekDays.forEach(day => {
            const dayHeader = createElement('th', { class: 'weekly-table__header' }, this.#formatDateShort(day.date));
            headerRow.appendChild(dayHeader);
        });

        // Colonne "Total"
        const totalHeader = createElement('th', { class: 'weekly-table__header weekly-table__header--total' }, 'Total');
        headerRow.appendChild(totalHeader);

        thead.appendChild(headerRow);
        this.weeklyTable.appendChild(thead);

        // Créer le corps du tableau
        const tbody = createElement('tbody');

        // Grouper les sessions par projet
        const sessionsByProject = this.#groupSessionsByProject(report);

        // Créer une ligne pour chaque projet
        Object.keys(sessionsByProject).forEach(projectId => {
            const projectData = sessionsByProject[projectId];
            const row = this.#createProjectRow(projectData, weekDays);
            tbody.appendChild(row);
        });

        // Créer la ligne de totaux
        const totalRow = this.#createTotalRow(weekDays);
        tbody.appendChild(totalRow);

        this.weeklyTable.appendChild(tbody);
    }

    /**
     * Affiche le tableau pour un mois (toutes les semaines)
     * @param {Object} report - Rapport avec toutes les données
     * @private
     */
    #renderMonthView(report) {
        // Grouper les jours par semaine
        const weeks = this.#groupDaysByWeek(report.dailyStats);

        if (weeks.length === 0) {
            const emptyRow = createElement('tr');
            const emptyCell = createElement('td', { colspan: '3' }, 'Aucune donnée pour ce mois');
            emptyRow.appendChild(emptyCell);
            this.weeklyTable.appendChild(emptyRow);
            return;
        }

        // Créer l'en-tête du tableau
        const thead = createElement('thead');
        const headerRow = createElement('tr');

        // Colonne "Projet"
        const projectHeader = createElement('th', { class: 'weekly-table__header' }, 'Projet');
        headerRow.appendChild(projectHeader);

        // Colonnes pour chaque semaine
        weeks.forEach((week, index) => {
            const weekLabel = `S${index + 1}`;
            const weekHeader = createElement('th', { class: 'weekly-table__header' }, weekLabel);
            headerRow.appendChild(weekHeader);
        });

        // Colonne "Total"
        const totalHeader = createElement('th', { class: 'weekly-table__header weekly-table__header--total' }, 'Total');
        headerRow.appendChild(totalHeader);

        thead.appendChild(headerRow);
        this.weeklyTable.appendChild(thead);

        // Créer le corps du tableau
        const tbody = createElement('tbody');

        // Grouper les sessions par projet
        const sessionsByProject = this.#groupSessionsByProject(report);

        // Créer une ligne pour chaque projet
        Object.keys(sessionsByProject).forEach(projectId => {
            const projectData = sessionsByProject[projectId];
            const row = this.#createProjectRowForMonth(projectData, weeks);
            tbody.appendChild(row);
        });

        // Créer la ligne de totaux
        const totalRow = this.#createTotalRowForMonth(weeks);
        tbody.appendChild(totalRow);

        this.weeklyTable.appendChild(tbody);
    }

    /**
     * Active un type de période (semaine/mois)
     * @param {string} periodType - Type de période ('week' ou 'month')
     */
    setActivePeriod(periodType) {
        if (periodType === 'week') {
            this.periodWeekBtn?.classList.add('period-selector__btn--active');
            this.periodMonthBtn?.classList.remove('period-selector__btn--active');
        } else if (periodType === 'month') {
            this.periodWeekBtn?.classList.remove('period-selector__btn--active');
            this.periodMonthBtn?.classList.add('period-selector__btn--active');
        }
    }

    // ======================
    // Création d'éléments pour le tableau hebdomadaire
    // ======================

    /**
     * Groupe les sessions par projet et par jour
     * @param {Object} report - Rapport avec toutes les données
     * @returns {Object} Sessions groupées par projet
     * @private
     */
    #groupSessionsByProject(report) {
        const grouped = {};

        if (!report.projectStats || report.projectStats.length === 0) {
            return grouped;
        }

        // Utiliser les projectStats pour obtenir les projets avec leurs durées quotidiennes
        report.projectStats.forEach(projectStat => {
            grouped[projectStat.projectId] = {
                projectId: projectStat.projectId,
                projectName: projectStat.projectName,
                projectColor: projectStat.projectColor,
                totalDuration: projectStat.duration,
                dailyDurations: projectStat.dailyDurations || {}
            };
        });

        return grouped;
    }

    /**
     * Crée une ligne de projet dans le tableau
     * @param {Object} projectData - Données du projet
     * @param {Object[]} weekDays - Jours de la semaine
     * @returns {HTMLElement}
     * @private
     */
    #createProjectRow(projectData, weekDays) {
        const row = createElement('tr', { class: 'weekly-table__row' });

        // Colonne du nom du projet
        const nameCell = createElement('td', { class: 'weekly-table__cell weekly-table__cell--project' });
        const colorIndicator = createElement('span', {
            class: 'weekly-table__color',
            style: `background-color: ${projectData.projectColor || '#6b7280'}`
        });
        nameCell.appendChild(colorIndicator);
        nameCell.appendChild(document.createTextNode(projectData.projectName));
        row.appendChild(nameCell);

        // Colonnes pour chaque jour
        weekDays.forEach(day => {
            const duration = projectData.dailyDurations[day.date] || 0;
            const cell = createElement('td', {
                class: 'weekly-table__cell weekly-table__cell--time'
            }, duration > 0 ? formatDuration(duration) : '-');
            row.appendChild(cell);
        });

        // Colonne Total
        const totalCell = createElement('td', {
            class: 'weekly-table__cell weekly-table__cell--total'
        }, formatDuration(projectData.totalDuration));
        row.appendChild(totalCell);

        return row;
    }

    /**
     * Crée la ligne de totaux
     * @param {Object[]} weekDays - Jours de la semaine
     * @returns {HTMLElement}
     * @private
     */
    #createTotalRow(weekDays) {
        const row = createElement('tr', { class: 'weekly-table__row weekly-table__row--total' });

        // Colonne du label avec indicateurs de couleur
        const labelCell = createElement('td', {
            class: 'weekly-table__cell weekly-table__cell--project weekly-table__cell--total-label'
        });

        // Ajouter les indicateurs de couleur
        const projectIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--project'
        });

        const presenceIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--presence'
        });

        labelCell.appendChild(projectIndicator);
        labelCell.appendChild(document.createTextNode(' Projets'));
        labelCell.appendChild(document.createElement('br'));
        labelCell.appendChild(presenceIndicator);
        labelCell.appendChild(document.createTextNode(' Présence'));

        row.appendChild(labelCell);

        // Colonnes pour chaque jour avec temps projet et temps présence
        weekDays.forEach(day => {
            const cell = createElement('td', { class: 'weekly-table__cell weekly-table__cell--total-time' });

            const projectTimeDiv = createElement('div', {
                class: 'weekly-table__total-project'
            }, formatDuration(day.projectTime));

            const presenceTimeDiv = createElement('div', {
                class: 'weekly-table__total-presence'
            }, formatDuration(day.presenceTime));

            cell.appendChild(projectTimeDiv);
            cell.appendChild(presenceTimeDiv);
            row.appendChild(cell);
        });

        // Colonne Total (vide pour la ligne de totaux)
        const totalCell = createElement('td', { class: 'weekly-table__cell' }, '-');
        row.appendChild(totalCell);

        return row;
    }

    /**
     * Groupe les jours par semaine
     * @param {Object[]} dailyStats - Statistiques quotidiennes
     * @returns {Object[]} Tableau de semaines avec leurs jours
     * @private
     */
    #groupDaysByWeek(dailyStats) {
        const weeks = [];
        let currentWeek = [];

        dailyStats.forEach((day, index) => {
            const date = new Date(day.date + 'T12:00:00');
            const dayOfWeek = date.getDay();

            // Filtrer uniquement les jours de semaine (lundi à vendredi)
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                currentWeek.push(day);
            }

            // Si c'est vendredi (5) ou le dernier jour, on termine la semaine
            if (dayOfWeek === 5 || index === dailyStats.length - 1) {
                if (currentWeek.length > 0) {
                    weeks.push({
                        days: currentWeek,
                        projectTime: currentWeek.reduce((sum, d) => sum + d.projectTime, 0),
                        presenceTime: currentWeek.reduce((sum, d) => sum + d.presenceTime, 0)
                    });
                    currentWeek = [];
                }
            }
        });

        return weeks;
    }

    /**
     * Crée une ligne de projet pour l'affichage mensuel
     * @param {Object} projectData - Données du projet
     * @param {Object[]} weeks - Semaines du mois
     * @returns {HTMLElement}
     * @private
     */
    #createProjectRowForMonth(projectData, weeks) {
        const row = createElement('tr', { class: 'weekly-table__row' });

        // Colonne du nom du projet
        const nameCell = createElement('td', { class: 'weekly-table__cell weekly-table__cell--project' });
        const colorIndicator = createElement('span', {
            class: 'weekly-table__color',
            style: `background-color: ${projectData.projectColor || '#6b7280'}`
        });
        nameCell.appendChild(colorIndicator);
        nameCell.appendChild(document.createTextNode(projectData.projectName));
        row.appendChild(nameCell);

        // Colonnes pour chaque semaine
        weeks.forEach(week => {
            // Calculer la durée totale du projet pour cette semaine
            const weekDuration = week.days.reduce((sum, day) => {
                return sum + (projectData.dailyDurations[day.date] || 0);
            }, 0);

            const cell = createElement('td', {
                class: 'weekly-table__cell weekly-table__cell--time'
            }, weekDuration > 0 ? formatDuration(weekDuration) : '-');
            row.appendChild(cell);
        });

        // Colonne Total
        const totalCell = createElement('td', {
            class: 'weekly-table__cell weekly-table__cell--total'
        }, formatDuration(projectData.totalDuration));
        row.appendChild(totalCell);

        return row;
    }

    /**
     * Crée la ligne de totaux pour l'affichage mensuel
     * @param {Object[]} weeks - Semaines du mois
     * @returns {HTMLElement}
     * @private
     */
    #createTotalRowForMonth(weeks) {
        const row = createElement('tr', { class: 'weekly-table__row weekly-table__row--total' });

        // Colonne du label avec indicateurs de couleur
        const labelCell = createElement('td', {
            class: 'weekly-table__cell weekly-table__cell--project weekly-table__cell--total-label'
        });

        // Ajouter les indicateurs de couleur
        const projectIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--project'
        });

        const presenceIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--presence'
        });

        labelCell.appendChild(projectIndicator);
        labelCell.appendChild(document.createTextNode(' Projets'));
        labelCell.appendChild(document.createElement('br'));
        labelCell.appendChild(presenceIndicator);
        labelCell.appendChild(document.createTextNode(' Présence'));

        row.appendChild(labelCell);

        // Colonnes pour chaque semaine
        weeks.forEach(week => {
            const cell = createElement('td', { class: 'weekly-table__cell weekly-table__cell--total-time' });

            const projectTimeDiv = createElement('div', {
                class: 'weekly-table__total-project'
            }, formatDuration(week.projectTime));

            const presenceTimeDiv = createElement('div', {
                class: 'weekly-table__total-presence'
            }, formatDuration(week.presenceTime));

            cell.appendChild(projectTimeDiv);
            cell.appendChild(presenceTimeDiv);
            row.appendChild(cell);
        });

        // Colonne Total (vide pour la ligne de totaux)
        const totalCell = createElement('td', { class: 'weekly-table__cell' }, '-');
        row.appendChild(totalCell);

        return row;
    }

    // ======================
    // Gestion des événements
    // ======================

    /**
     * Configure les écouteurs d'événements
     * @private
     */
    #setupEventListeners() {
        // Boutons de sélection de période
        this.periodWeekBtn?.addEventListener('click', () => {
            if (this.onPeriodTypeChange) {
                this.onPeriodTypeChange('week');
            }
        });

        this.periodMonthBtn?.addEventListener('click', () => {
            if (this.onPeriodTypeChange) {
                this.onPeriodTypeChange('month');
            }
        });

        // Boutons de navigation
        this.periodPrevBtn?.addEventListener('click', () => {
            if (this.onPeriodNavigate) {
                this.onPeriodNavigate('prev');
            }
        });

        this.periodNextBtn?.addEventListener('click', () => {
            if (this.onPeriodNavigate) {
                this.onPeriodNavigate('next');
            }
        });
    }

    // ======================
    // Méthodes utilitaires
    // ======================

    /**
     * Formate une date en format lisible (ex: "Mercredi 13 Nov")
     * @param {string} dateString - Date au format YYYY-MM-DD
     * @returns {string}
     * @private
     */
    #formatDate(dateString) {
        const date = new Date(dateString + 'T12:00:00');
        const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
    }

    /**
     * Formate une date en format court (ex: "Lun 13")
     * @param {string} dateString - Date au format YYYY-MM-DD
     * @returns {string}
     * @private
     */
    #formatDateShort(dateString) {
        const date = new Date(dateString + 'T12:00:00');
        const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

        return `${days[date.getDay()]} ${date.getDate()}`;
    }

    /**
     * Affiche un message de succès (toast)
     * @param {string} message - Message à afficher
     */
    showSuccess(message) {
        this.#showToast(message, 'success');
    }

    /**
     * Affiche un message d'erreur (toast)
     * @param {string} message - Message à afficher
     */
    showError(message) {
        this.#showToast(message, 'error');
    }

    /**
     * Affiche un toast
     * @param {string} message - Message
     * @param {string} type - Type (success, error)
     * @private
     */
    #showToast(message, type) {
        const toast = createElement('div', {
            class: `toast toast--${type}`
        }, message);

        document.body.appendChild(toast);

        // Afficher le toast
        setTimeout(() => {
            toast.classList.add('toast--show');
        }, 10);

        // Masquer et supprimer le toast après 3 secondes
        setTimeout(() => {
            toast.classList.remove('toast--show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}
