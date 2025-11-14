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
        this.reportIncompleteDays = null;
        this.reportProjectsList = null;
        this.incompleteDaysList = null;
        this.dailyChartContainer = null;
        this.periodWeekBtn = null;
        this.periodMonthBtn = null;
        this.periodPrevBtn = null;
        this.periodNextBtn = null;

        // Callbacks
        this.onPeriodTypeChange = null;
        this.onPeriodNavigate = null;
        this.onExportReportCSV = null;
        this.onExportReportJSON = null;
        this.onExportAllData = null;
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
        this.reportIncompleteDays = document.getElementById('report-incomplete-days');
        this.reportProjectsList = document.getElementById('report-projects-list');
        this.incompleteDaysList = document.getElementById('incomplete-days-list');
        this.dailyChartContainer = document.getElementById('daily-chart-container');
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

        if (this.reportIncompleteDays) {
            this.reportIncompleteDays.textContent = stats.period.incompleteDays;
        }
    }

    /**
     * Affiche la liste des projets avec leurs statistiques
     * @param {Object[]} projectStats - Statistiques par projet
     */
    renderProjectStats(projectStats) {
        if (!this.reportProjectsList) return;

        // Vider la liste
        this.reportProjectsList.innerHTML = '';

        if (!projectStats || projectStats.length === 0) {
            const emptyMessage = createElement('p', { class: 'report-projects__empty' }, 'Aucune donnée pour cette période');
            this.reportProjectsList.appendChild(emptyMessage);
            return;
        }

        // Créer un élément pour chaque projet
        projectStats.forEach(stat => {
            const item = this.#createProjectStatItem(stat);
            this.reportProjectsList.appendChild(item);
        });
    }

    /**
     * Affiche la liste des jours incomplets
     * @param {Object[]} incompleteDays - Liste des jours incomplets
     */
    renderIncompleteDays(incompleteDays) {
        if (!this.incompleteDaysList) return;

        // Vider la liste
        this.incompleteDaysList.innerHTML = '';

        if (!incompleteDays || incompleteDays.length === 0) {
            const emptyMessage = createElement('p', { class: 'incomplete-days__empty' }, 'Aucun jour incomplet');
            this.incompleteDaysList.appendChild(emptyMessage);
            return;
        }

        // Créer un élément pour chaque jour incomplet
        incompleteDays.forEach(day => {
            const item = this.#createIncompleteDayItem(day);
            this.incompleteDaysList.appendChild(item);
        });
    }

    /**
     * Affiche le graphique quotidien
     * @param {Object[]} dailyStats - Statistiques quotidiennes
     */
    renderDailyChart(dailyStats) {
        if (!this.dailyChartContainer) return;

        // Vider le conteneur
        this.dailyChartContainer.innerHTML = '';

        // Filtrer les jours travaillés
        const workedDays = dailyStats.filter(day => day.hasEntries);

        if (!workedDays || workedDays.length === 0) {
            const emptyMessage = createElement('p', { class: 'daily-chart__empty' }, 'Aucune donnée à afficher');
            this.dailyChartContainer.appendChild(emptyMessage);
            return;
        }

        // Trouver la valeur max pour normaliser les barres
        const maxValue = Math.max(...workedDays.map(day => day.presenceTime), 8 * 3600000); // Au moins 8h pour l'échelle

        // Créer le conteneur des barres
        const barsContainer = createElement('div', { class: 'daily-chart__bars' });

        workedDays.forEach(day => {
            const bar = this.#createChartBar(day, maxValue);
            barsContainer.appendChild(bar);
        });

        this.dailyChartContainer.appendChild(barsContainer);
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
    // Création d'éléments
    // ======================

    /**
     * Crée un élément de statistique de projet
     * @param {Object} stat - Statistique du projet
     * @returns {HTMLElement}
     * @private
     */
    #createProjectStatItem(stat) {
        const item = createElement('div', { class: 'report-project-item' });

        // En-tête avec nom et statistiques
        const header = createElement('div', { class: 'report-project-item__header' });

        const nameContainer = createElement('div', { class: 'report-project-item__name' });
        const colorIndicator = createElement('span', {
            class: 'report-project-item__color',
            style: `background-color: ${stat.projectColor || '#6b7280'}`
        });
        nameContainer.appendChild(colorIndicator);
        nameContainer.appendChild(document.createTextNode(stat.projectName));

        const statsContainer = createElement('div', { class: 'report-project-item__stats' });
        const duration = createElement('span', { class: 'report-project-item__duration' }, formatDuration(stat.duration));
        const percentage = createElement('span', { class: 'report-project-item__percentage' }, `${stat.percentage}%`);
        statsContainer.appendChild(duration);
        statsContainer.appendChild(percentage);

        header.appendChild(nameContainer);
        header.appendChild(statsContainer);

        // Barre de progression
        const barContainer = createElement('div', { class: 'report-project-item__bar' });
        const barFill = createElement('div', {
            class: 'report-project-item__bar-fill',
            style: `width: ${stat.percentage}%; background-color: ${stat.projectColor || '#2563eb'}`
        });
        barContainer.appendChild(barFill);

        item.appendChild(header);
        item.appendChild(barContainer);

        return item;
    }

    /**
     * Crée un élément de jour incomplet
     * @param {Object} day - Informations du jour incomplet
     * @returns {HTMLElement}
     * @private
     */
    #createIncompleteDayItem(day) {
        const item = createElement('div', { class: 'incomplete-day-item' });

        const dateElement = createElement('div', { class: 'incomplete-day-item__date' }, this.#formatDate(day.date));

        const infoContainer = createElement('div', { class: 'incomplete-day-item__info' });
        const timeElement = createElement('div', { class: 'incomplete-day-item__time' }, formatDuration(day.presenceTime));
        const missingElement = createElement('div', { class: 'incomplete-day-item__missing' }, `Manque: ${formatDuration(day.missingTime)}`);
        infoContainer.appendChild(timeElement);
        infoContainer.appendChild(missingElement);

        item.appendChild(dateElement);
        item.appendChild(infoContainer);

        return item;
    }

    /**
     * Crée une barre de graphique
     * @param {Object} day - Données du jour
     * @param {number} maxValue - Valeur max pour normaliser la hauteur
     * @returns {HTMLElement}
     * @private
     */
    #createChartBar(day, maxValue) {
        const bar = createElement('div', { class: 'daily-chart__bar' });

        // Calculer la hauteur en pourcentage
        const heightPercent = (day.presenceTime / maxValue) * 100;

        // Conteneur de la barre
        const barContainer = createElement('div', { class: 'daily-chart__bar-container' });

        // Remplissage de la barre
        const barFill = createElement('div', {
            class: `daily-chart__bar-fill ${day.isComplete ? '' : 'daily-chart__bar-fill--incomplete'}`,
            style: `height: ${heightPercent}%`
        });

        // Valeur affichée au-dessus de la barre
        const value = createElement('div', { class: 'daily-chart__bar-value' }, formatDuration(day.presenceTime));
        barFill.appendChild(value);

        barContainer.appendChild(barFill);

        // Label en dessous
        const label = createElement('div', { class: 'daily-chart__bar-label' }, this.#formatDateShort(day.date));

        bar.appendChild(barContainer);
        bar.appendChild(label);

        return bar;
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

        // Boutons d'export
        document.getElementById('export-report-csv-btn')?.addEventListener('click', () => {
            if (this.onExportReportCSV) {
                this.onExportReportCSV();
            }
        });

        document.getElementById('export-report-json-btn')?.addEventListener('click', () => {
            if (this.onExportReportJSON) {
                this.onExportReportJSON();
            }
        });

        document.getElementById('export-all-data-btn')?.addEventListener('click', () => {
            if (this.onExportAllData) {
                this.onExportAllData();
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
