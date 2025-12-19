'use strict';

import { formatDuration, createElement } from './utils.js';
import { ENTRY_TYPES } from './time-entry.js';

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
        this.dayTimelineModal = null;
        this.dayTimelineModalTitle = null;
        this.dayTimelineModalContent = null;
        this.closeDayTimelineModalBtn = null;
        this.dayTimelineModalOverlay = null;

        // Callbacks
        this.onPeriodTypeChange = null;
        this.onPeriodNavigate = null;
        this.onDayTimelineRequest = null; // Callback pour charger les données d'un jour
        this.onPresenceTimeClick = null; // Callback pour gérer le clic sur le temps de présence
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
        this.dayTimelineModal = document.getElementById('day-timeline-modal');
        this.dayTimelineModalTitle = document.getElementById('day-timeline-modal-title');
        this.dayTimelineModalContent = document.getElementById('day-timeline-modal-content');
        this.closeDayTimelineModalBtn = document.getElementById('close-day-timeline-modal-btn');
        this.dayTimelineModalOverlay = this.dayTimelineModal?.querySelector('.modal__overlay');

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
        const projectHeader = createElement('th', { class: 'weekly-table__header weekly-table__header--project' }, 'Projet');
        headerRow.appendChild(projectHeader);

        // Colonnes pour chaque jour (lundi à vendredi)
        weekDays.forEach(day => {
            const dayHeader = createElement('th', { class: 'weekly-table__header' });

            // Créer un conteneur pour la date et le bouton
            const headerContent = createElement('div', { class: 'weekly-table__header-content' });

            // Ajouter la date
            const dateText = createElement('span', { class: 'weekly-table__header-date' }, this.#formatDateShort(day.date));
            headerContent.appendChild(dateText);

            // Ajouter le bouton de timeline
            const timelineBtn = createElement('button', {
                class: 'weekly-table__timeline-btn',
                title: 'Voir la timeline de ce jour',
                'data-date': day.date
            }, '📊');

            timelineBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDayTimeline(day.date);
            });

            headerContent.appendChild(timelineBtn);
            dayHeader.appendChild(headerContent);
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

        // Trier les projets par ordre alphabétique
        const sortedProjectIds = Object.keys(sessionsByProject).sort((a, b) => {
            const nameA = sessionsByProject[a].projectName;
            const nameB = sessionsByProject[b].projectName;
            return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
        });

        // Créer une ligne pour chaque projet
        sortedProjectIds.forEach(projectId => {
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
        const projectHeader = createElement('th', { class: 'weekly-table__header weekly-table__header--project' }, 'Projet');
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

        // Trier les projets par ordre alphabétique
        const sortedProjectIds = Object.keys(sessionsByProject).sort((a, b) => {
            const nameA = sessionsByProject[a].projectName;
            const nameB = sessionsByProject[b].projectName;
            return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
        });

        // Créer une ligne pour chaque projet
        sortedProjectIds.forEach(projectId => {
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
            class: 'weekly-table__cell weekly-table__cell--total-label'
        });

        // Ajouter les divs pour "Projets" et "Présence" avec leurs indicateurs
        const projectDiv = createElement('div', {
            class: 'weekly-table__total-project'
        });
        const projectIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--project'
        });
        projectDiv.appendChild(projectIndicator);
        projectDiv.appendChild(document.createTextNode(' Projets'));

        const presenceDiv = createElement('div', {
            class: 'weekly-table__total-presence'
        });
        const presenceIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--presence'
        });
        presenceDiv.appendChild(presenceIndicator);
        presenceDiv.appendChild(document.createTextNode(' Présence'));

        labelCell.appendChild(projectDiv);
        labelCell.appendChild(presenceDiv);

        row.appendChild(labelCell);

        // Colonnes pour chaque jour avec temps projet et temps présence
        weekDays.forEach(day => {
            const cell = createElement('td', { class: 'weekly-table__cell weekly-table__cell--total-time' });

            const projectTimeDiv = createElement('div', {
                class: 'weekly-table__total-project'
            }, formatDuration(day.projectTime));

            const presenceTimeDiv = createElement('div', {
                class: 'weekly-table__total-presence weekly-table__total-presence--clickable',
                'data-date': day.date,
                title: 'Cliquez pour modifier les pointages de ce jour'
            }, formatDuration(day.presenceTime));

            // Ajouter un event listener pour rendre le temps de présence cliquable
            presenceTimeDiv.addEventListener('click', () => {
                if (this.onPresenceTimeClick && day.hasEntries) {
                    this.onPresenceTimeClick(day.date);
                }
            });

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
            class: 'weekly-table__cell weekly-table__cell--total-label'
        });

        // Ajouter les divs pour "Projets" et "Présence" avec leurs indicateurs
        const projectDiv = createElement('div', {
            class: 'weekly-table__total-project'
        });
        const projectIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--project'
        });
        projectDiv.appendChild(projectIndicator);
        projectDiv.appendChild(document.createTextNode(' Projets'));

        const presenceDiv = createElement('div', {
            class: 'weekly-table__total-presence'
        });
        const presenceIndicator = createElement('span', {
            class: 'weekly-table__color weekly-table__color--presence'
        });
        presenceDiv.appendChild(presenceIndicator);
        presenceDiv.appendChild(document.createTextNode(' Présence'));

        labelCell.appendChild(projectDiv);
        labelCell.appendChild(presenceDiv);

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

            // Note: Pour la vue mensuelle, on ne rend pas le temps de présence cliquable
            // car il représente une semaine entière, pas un jour spécifique

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

        // Boutons de la modale de timeline
        this.closeDayTimelineModalBtn?.addEventListener('click', () => {
            this.#closeDayTimelineModal();
        });

        this.dayTimelineModalOverlay?.addEventListener('click', () => {
            this.#closeDayTimelineModal();
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

    // ======================
    // Gestion de la modale de timeline
    // ======================

    /**
     * Ouvre la modale de timeline pour un jour spécifique
     * @param {string} date - Date au format YYYY-MM-DD
     */
    async showDayTimeline(date) {
        if (!this.dayTimelineModal) return;

        // Mettre à jour le titre avec la date
        if (this.dayTimelineModalTitle) {
            this.dayTimelineModalTitle.textContent = `Timeline du ${this.#formatDate(date)}`;
        }

        // Afficher un message de chargement
        if (this.dayTimelineModalContent) {
            this.dayTimelineModalContent.innerHTML = '<p class="day-timeline__empty">Chargement...</p>';
        }

        // Ouvrir la modale
        this.dayTimelineModal.classList.add('modal--visible');

        // Charger les données du jour via le callback
        if (this.onDayTimelineRequest) {
            const dayData = await this.onDayTimelineRequest(date);
            this.#renderDayTimelineInModal(dayData);
        }
    }

    /**
     * Ferme la modale de timeline
     * @private
     */
    #closeDayTimelineModal() {
        if (this.dayTimelineModal) {
            this.dayTimelineModal.classList.remove('modal--visible');
        }
    }

    /**
     * Rend la timeline d'un jour dans la modale
     * @param {Object} dayData - Données du jour (entries, sessions, projects)
     * @private
     */
    #renderDayTimelineInModal(dayData) {
        if (!this.dayTimelineModalContent) return;

        const { entries, sessions, projects } = dayData;

        // Vérifier s'il y a des données
        if ((!entries || entries.length === 0) && (!sessions || sessions.length === 0)) {
            this.dayTimelineModalContent.innerHTML = '<p class="day-timeline__empty">Aucun pointage pour ce jour</p>';
            return;
        }

        // Utiliser la même logique que DayTimeline pour créer la timeline
        const { startTime, endTime } = this.#getTimeRange(entries, sessions);

        if (!startTime) {
            this.dayTimelineModalContent.innerHTML = '<p class="day-timeline__empty">Aucun pointage pour ce jour</p>';
            return;
        }

        // Créer la timeline
        this.#renderTimelineInModal(startTime, endTime, entries, sessions, projects);
    }

    /**
     * Détermine les bornes de temps pour la journée
     * @param {Object[]} entries - Pointages du jour
     * @param {Object[]} sessions - Sessions de projet du jour
     * @returns {Object} { startTime, endTime }
     * @private
     */
    #getTimeRange(entries, sessions) {
        let startTime = null;
        let endTime = null;

        // Priorité 1 : Trouver le pointage d'arrivée (CLOCK_IN)
        const clockInEntry = entries?.find(e => e.type === ENTRY_TYPES.CLOCK_IN);

        if (clockInEntry) {
            startTime = new Date(clockInEntry.timestamp);
        } else if (sessions && sessions.length > 0) {
            // Priorité 2 : Si pas de CLOCK_IN, utiliser la première session
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
            startTime = new Date(sortedSessions[0].startTime);
        }

        // Trouver l'heure de fin
        const clockOutEntry = entries?.find(e => e.type === ENTRY_TYPES.CLOCK_OUT);

        if (clockOutEntry) {
            endTime = new Date(clockOutEntry.timestamp);
        } else if (sessions && sessions.length > 0) {
            // Utiliser la fin de la dernière session
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(b.endTime || b.startTime) - new Date(a.endTime || a.startTime)
            );
            const lastSession = sortedSessions[0];
            endTime = lastSession.endTime ? new Date(lastSession.endTime) : new Date();
        } else if (startTime) {
            // Si pas de fin, utiliser maintenant
            endTime = new Date();
        }

        return { startTime, endTime };
    }

    /**
     * Rend la timeline dans la modale
     * @param {Date} startTime - Heure de début
     * @param {Date} endTime - Heure de fin
     * @param {Object[]} entries - Pointages
     * @param {Object[]} sessions - Sessions
     * @param {Object[]} projects - Projets
     * @private
     */
    #renderTimelineInModal(startTime, endTime, entries, sessions, projects) {
        const totalDuration = endTime - startTime;

        // Créer les segments
        const segments = this.#createTimelineSegments(startTime, endTime, entries, sessions, projects);

        // Formater le temps
        const formatTime = (date) => {
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        };

        // Formater la durée
        const formatDuration = (ms) => {
            const hours = Math.floor(ms / 3600000);
            const minutes = Math.floor((ms % 3600000) / 60000);
            return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
        };

        // Créer le détail textuel de la journée
        const detailsHtml = this.#renderDayDetailsText(entries, sessions, projects, formatTime);

        // Créer le HTML avec la timeline et les détails
        const html = `
            <div class="day-timeline__bar">
                ${segments.map(segment => this.#renderSegmentInModal(segment, startTime, totalDuration, formatTime, formatDuration)).join('')}
            </div>
            <div class="day-timeline__labels">
                <span>${formatTime(startTime)}</span>
                <span>${formatTime(endTime)}</span>
            </div>
            ${detailsHtml}
        `;

        this.dayTimelineModalContent.innerHTML = html;
    }

    /**
     * Crée les segments de la timeline
     * @private
     */
    #createTimelineSegments(startTime, endTime, entries, sessions, projects) {
        const segments = [];

        // Créer une timeline des événements
        const events = [];

        // Ajouter les entrées
        if (entries && entries.length > 0) {
            entries.forEach(entry => {
                events.push({
                    time: new Date(entry.timestamp),
                    type: entry.type,
                    isEntry: true
                });
            });
        }

        // Ajouter les sessions
        if (sessions && sessions.length > 0) {
            sessions.forEach(session => {
                const project = projects?.find(p => p.id === session.projectId);
                events.push({
                    time: new Date(session.startTime),
                    type: 'session-start',
                    session,
                    project
                });
                if (session.endTime) {
                    events.push({
                        time: new Date(session.endTime),
                        type: 'session-end',
                        session
                    });
                }
            });
        }

        // Trier les événements par temps
        events.sort((a, b) => a.time - b.time);

        // État actuel
        let inBreak = false;
        let currentSession = null;
        let lastTime = startTime;

        // Parcourir les événements et créer les segments
        events.forEach(event => {
            const eventTime = event.time;

            if (event.isEntry) {
                if (event.type === ENTRY_TYPES.BREAK_START) {
                    // Si on était dans une session, la terminer
                    if (currentSession) {
                        const project = projects?.find(p => p.id === currentSession.projectId);
                        segments.push({
                            start: lastTime,
                            end: eventTime,
                            type: 'project',
                            label: project?.name || 'Projet',
                            color: project?.color
                        });
                        currentSession = null;
                    }
                    inBreak = true;
                    lastTime = eventTime;
                } else if (event.type === ENTRY_TYPES.BREAK_END) {
                    if (inBreak) {
                        segments.push({
                            start: lastTime,
                            end: eventTime,
                            type: 'break',
                            label: 'Pause'
                        });
                    }
                    inBreak = false;
                    lastTime = eventTime;
                }
            } else if (event.type === 'session-start') {
                currentSession = event.session;
                // Ne pas créer de segment maintenant, attendre la fin
            } else if (event.type === 'session-end') {
                if (currentSession && currentSession.id === event.session.id) {
                    const project = projects?.find(p => p.id === currentSession.projectId);
                    segments.push({
                        start: new Date(currentSession.startTime),
                        end: eventTime,
                        type: 'project',
                        label: project?.name || 'Projet',
                        color: project?.color
                    });
                    currentSession = null;
                }
            }
        });

        // Si on a une session en cours, la terminer à endTime
        if (currentSession) {
            const project = projects?.find(p => p.id === currentSession.projectId);
            segments.push({
                start: new Date(currentSession.startTime),
                end: endTime,
                type: 'project',
                label: project?.name || 'Projet',
                color: project?.color
            });
        }

        // Si on est en pause, la terminer
        if (inBreak) {
            segments.push({
                start: lastTime,
                end: endTime,
                type: 'break',
                label: 'Pause'
            });
        }

        return segments;
    }

    /**
     * Rend un segment de la timeline
     * @private
     */
    #renderSegmentInModal(segment, startTime, totalDuration, formatTime, formatDuration) {
        const leftPercent = ((segment.start - startTime) / totalDuration) * 100;
        const widthPercent = ((segment.end - segment.start) / totalDuration) * 100;

        const duration = formatDuration(segment.end - segment.start);
        const tooltip = `${segment.label}\n${formatTime(segment.start)} - ${formatTime(segment.end)}\n${duration}`;

        const style = segment.color ? `background-color: ${segment.color}` : '';

        return `
            <div class="day-timeline__segment day-timeline__segment--${segment.type}"
                 style="left: ${leftPercent}%; width: ${widthPercent}%; ${style}"
                 title="${tooltip}">
                <div class="day-timeline__tooltip">
                    ${segment.label}<br>
                    ${formatTime(segment.start)} - ${formatTime(segment.end)}<br>
                    ${duration}
                </div>
                ${widthPercent > 8 ? `<span class="day-timeline__segment-label">${segment.label}</span>` : ''}
            </div>
        `;
    }

    /**
     * Rend le détail textuel de la journée
     * @param {Object[]} entries - Pointages
     * @param {Object[]} sessions - Sessions de projet
     * @param {Object[]} projects - Projets
     * @param {Function} formatTime - Fonction de formatage du temps
     * @returns {string} HTML du détail textuel
     * @private
     */
    #renderDayDetailsText(entries, sessions, projects, formatTime) {
        if ((!entries || entries.length === 0) && (!sessions || sessions.length === 0)) {
            return '';
        }

        // Combiner toutes les activités avec leur timestamp
        const timeline = [];

        // Ajouter les pointages
        if (entries && entries.length > 0) {
            entries.forEach(entry => {
                const type = this.#getEntryTypeLabel(entry.type);
                timeline.push({
                    time: new Date(entry.timestamp),
                    type: 'entry',
                    label: type,
                    subtype: entry.type
                });
            });
        }

        // Ajouter les sessions
        if (sessions && sessions.length > 0) {
            sessions.forEach(session => {
                const project = projects?.find(p => p.id === session.projectId);
                const sessionEnd = session.endTime ? new Date(session.endTime) : new Date();
                const sessionStart = new Date(session.startTime);
                const durationMs = sessionEnd - sessionStart;
                const hours = Math.floor(durationMs / 3600000);
                const minutes = Math.floor((durationMs % 3600000) / 60000);
                const duration = `${hours}h ${minutes.toString().padStart(2, '0')}m`;

                timeline.push({
                    time: sessionStart,
                    type: 'session-start',
                    label: `Début session: ${project?.name || 'Projet inconnu'}`,
                    duration: duration,
                    projectColor: project?.color
                });

                if (session.endTime) {
                    timeline.push({
                        time: sessionEnd,
                        type: 'session-end',
                        label: `Fin session: ${project?.name || 'Projet inconnu'}`,
                        projectColor: project?.color
                    });
                }
            });
        }

        // Trier par ordre chronologique
        timeline.sort((a, b) => a.time - b.time);

        // Générer le HTML
        const detailsItems = timeline.map(item => {
            let className = 'day-details-item';

            if (item.type === 'entry') {
                if (this.#isBreakEntry(item.subtype)) {
                    className += ' day-details-item--break';
                } else {
                    className += ' day-details-item--entry';
                }
            } else {
                className += ' day-details-item--session';
            }

            return `
                <div class="${className}">
                    <div class="day-details-item__time">${formatTime(item.time)}</div>
                    <div class="day-details-item__label">${item.label}</div>
                    ${item.duration ? `<div class="day-details-item__duration">Durée: ${item.duration}</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="day-timeline-details">
                <h4 class="day-timeline-details__title">Détail de la journée</h4>
                <div class="day-timeline-details__list">
                    ${detailsItems}
                </div>
            </div>
        `;
    }

    /**
     * Obtient le libellé d'un type de pointage
     * @param {string} type - Type de pointage
     * @returns {string} Libellé
     * @private
     */
    #getEntryTypeLabel(type) {
        const labels = {
            [ENTRY_TYPES.CLOCK_IN]: '🟢 Arrivée',
            [ENTRY_TYPES.CLOCK_OUT]: '🔴 Départ',
            [ENTRY_TYPES.BREAK_START]: '⏸️ Début de pause',
            [ENTRY_TYPES.BREAK_END]: '▶️ Fin de pause',
            [ENTRY_TYPES.LUNCH_START]: '⏸️ Début de pause déjeuner',
            [ENTRY_TYPES.LUNCH_END]: '▶️ Fin de pause déjeuner'
        };
        return labels[type] || type;
    }

    /**
     * Vérifie si un type de pointage est une pause
     * @param {string} type - Type de pointage
     * @returns {boolean}
     * @private
     */
    #isBreakEntry(type) {
        return type === ENTRY_TYPES.BREAK_START ||
               type === ENTRY_TYPES.BREAK_END ||
               type === ENTRY_TYPES.LUNCH_START ||
               type === ENTRY_TYPES.LUNCH_END;
    }
}
