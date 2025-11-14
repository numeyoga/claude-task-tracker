'use strict';

import { formatDuration, createElement } from './utils.js';

/**
 * Gestion de l'interface utilisateur pour le chronomètre de projet
 */
export class ProjectTimerUI {
    constructor() {
        this.elements = {
            timerDisplay: null,
            timerProjectName: null,
            timerDuration: null,
            currentProjectIndicator: null,
            statsContainer: null
        };

        // Callbacks
        this.onStartProject = null;
        this.onStopTimer = null;
    }

    /**
     * Initialise les références aux éléments DOM
     */
    init() {
        this.elements.timerDisplay = document.getElementById('timer-display');
        this.elements.timerProjectName = document.getElementById('timer-project-name');
        this.elements.timerDuration = document.getElementById('timer-duration');
        this.elements.currentProjectIndicator = document.getElementById('current-project-indicator');
        this.elements.statsContainer = document.getElementById('project-stats');

        // Bouton pour arrêter le timer
        const stopBtn = document.getElementById('stop-timer-btn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                if (this.onStopTimer) {
                    this.onStopTimer();
                }
            });
        }

        console.log('✅ ProjectTimerUI initialisée');
    }

    /**
     * Configure les écouteurs pour les boutons de démarrage des projets
     * @param {Project[]} projects - Liste des projets
     */
    setupProjectButtons(projects) {
        // Cette méthode sera appelée après le rendu des projets
        // pour attacher les écouteurs d'événements aux boutons
    }

    /**
     * Met à jour l'affichage du chronomètre
     * @param {string|null} projectId - ID du projet en cours (null si arrêté)
     * @param {string|null} projectName - Nom du projet
     * @param {number} duration - Durée en millisecondes
     */
    updateTimer(projectId, projectName, duration) {
        if (!this.elements.timerDisplay) return;

        if (projectId) {
            // Afficher le timer en cours
            this.elements.timerDisplay.classList.add('timer-display--running');
            this.elements.timerDisplay.classList.remove('timer-display--stopped');

            if (this.elements.timerProjectName) {
                this.elements.timerProjectName.textContent = projectName || 'Projet inconnu';
            }

            if (this.elements.timerDuration) {
                this.elements.timerDuration.textContent = formatDuration(duration);
            }
        } else {
            // Arrêter le timer
            this.elements.timerDisplay.classList.remove('timer-display--running');
            this.elements.timerDisplay.classList.add('timer-display--stopped');

            if (this.elements.timerProjectName) {
                this.elements.timerProjectName.textContent = 'Aucun projet en cours';
            }

            if (this.elements.timerDuration) {
                this.elements.timerDuration.textContent = '0h 00m';
            }
        }
    }

    /**
     * Met à jour l'indicateur du projet actif dans la liste
     * @param {string|null} currentProjectId - ID du projet en cours
     */
    updateCurrentProjectIndicator(currentProjectId) {
        // Retirer tous les indicateurs existants
        const allRows = document.querySelectorAll('.projects-table__row');
        allRows.forEach(row => {
            row.classList.remove('projects-table__row--active');
        });

        // Ajouter l'indicateur sur le projet actif
        if (currentProjectId) {
            const activeRow = document.querySelector(`[data-project-id="${currentProjectId}"]`);
            if (activeRow) {
                activeRow.classList.add('projects-table__row--active');
            }
        }
    }

    /**
     * Affiche les statistiques des projets pour la journée
     * @param {Object[]} stats - Statistiques par projet
     */
    renderStats(stats) {
        if (!this.elements.statsContainer) return;

        // Vider le conteneur
        this.elements.statsContainer.innerHTML = '';

        if (!stats || stats.length === 0) {
            const emptyMessage = createElement('p', {
                class: 'project-stats__empty'
            }, 'Aucune session de travail pour aujourd\'hui');

            this.elements.statsContainer.appendChild(emptyMessage);
            return;
        }

        // Créer les cartes de statistiques
        stats.forEach(stat => {
            const card = this.#createStatCard(stat);
            this.elements.statsContainer.appendChild(card);
        });
    }

    /**
     * Crée une carte de statistique pour un projet
     * @param {Object} stat - Statistiques du projet
     * @returns {HTMLElement}
     * @private
     */
    #createStatCard(stat) {
        const card = createElement('div', {
            class: `project-stat-card ${stat.isRunning ? 'project-stat-card--running' : ''}`
        });

        // En-tête avec nom et icône
        const header = createElement('div', {
            class: 'project-stat-card__header'
        });

        const name = createElement('div', {
            class: 'project-stat-card__name'
        }, stat.projectName);

        const icon = createElement('div', {
            class: 'project-stat-card__icon'
        }, stat.isRunning ? '▶️' : '');

        header.appendChild(name);
        header.appendChild(icon);

        // Durée
        const duration = createElement('div', {
            class: 'project-stat-card__duration'
        }, formatDuration(stat.duration));

        // Barre de pourcentage
        const progressBar = createElement('div', {
            class: 'project-stat-card__progress'
        });

        const progressFill = createElement('div', {
            class: 'project-stat-card__progress-fill',
            style: `width: ${stat.percentage}%`
        });

        progressBar.appendChild(progressFill);

        // Pourcentage
        const percentage = createElement('div', {
            class: 'project-stat-card__percentage'
        }, `${stat.percentage}%`);

        // Assembler la carte
        card.appendChild(header);
        card.appendChild(duration);
        card.appendChild(progressBar);
        card.appendChild(percentage);

        return card;
    }

    /**
     * Affiche un message de succès
     * @param {string} message - Message à afficher
     */
    showSuccess(message) {
        const toast = createElement('div', {
            class: 'toast toast--success'
        }, message);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Message à afficher
     */
    showError(message) {
        const toast = createElement('div', {
            class: 'toast toast--error'
        }, message);

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--visible');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}
