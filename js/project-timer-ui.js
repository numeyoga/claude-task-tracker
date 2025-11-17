'use strict';

import { formatDuration, formatTime, createElement } from './utils.js';

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
            statsContainer: null,
            modal: null,
            modalProjectName: null,
            sessionsList: null,
            closeModalBtn: null
        };

        // Callbacks
        this.onStartProject = null;
        this.onStopTimer = null;
        this.onGetSessionsForProject = null; // Callback pour récupérer les sessions d'un projet
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
        this.elements.stopTimerBtn = document.getElementById('stop-timer-btn');
        if (this.elements.stopTimerBtn) {
            this.elements.stopTimerBtn.addEventListener('click', () => {
                if (this.onStopTimer) {
                    this.onStopTimer();
                }
            });
        }

        // Modal pour les détails des sessions
        this.elements.modal = document.getElementById('session-details-modal');
        this.elements.modalProjectName = document.getElementById('modal-project-name');
        this.elements.sessionsList = document.getElementById('sessions-list');
        this.elements.closeModalBtn = document.getElementById('close-modal-btn');

        // Gestionnaire pour fermer le modal
        if (this.elements.closeModalBtn) {
            this.elements.closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Fermer le modal en cliquant sur l'overlay
        if (this.elements.modal) {
            const overlay = this.elements.modal.querySelector('.modal__overlay');
            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.closeModal();
                });
            }
        }

        // Fermer le modal avec la touche Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal?.classList.contains('modal--visible')) {
                this.closeModal();
            }
        });

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
            this.elements.timerDisplay.classList.add('timer-display-compact--running');
            this.elements.timerDisplay.classList.remove('timer-display-compact--stopped');

            if (this.elements.timerProjectName) {
                this.elements.timerProjectName.textContent = projectName || 'Projet inconnu';
            }

            if (this.elements.timerDuration) {
                this.elements.timerDuration.textContent = formatDuration(duration);
            }

            // Activer le bouton d'arrêt
            if (this.elements.stopTimerBtn) {
                this.elements.stopTimerBtn.disabled = false;
            }
        } else {
            // Arrêter le timer
            this.elements.timerDisplay.classList.remove('timer-display-compact--running');
            this.elements.timerDisplay.classList.add('timer-display-compact--stopped');

            if (this.elements.timerProjectName) {
                this.elements.timerProjectName.textContent = 'Aucun projet en cours';
            }

            if (this.elements.timerDuration) {
                this.elements.timerDuration.textContent = '0h 00m';
            }

            // Désactiver le bouton d'arrêt
            if (this.elements.stopTimerBtn) {
                this.elements.stopTimerBtn.disabled = true;
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
            class: `project-stat-card ${stat.isRunning ? 'project-stat-card--running' : ''}`,
            dataset: {
                projectId: stat.projectId
            }
        });

        // Ajouter le gestionnaire de clic pour afficher les détails
        card.addEventListener('click', () => {
            this.showSessionDetails(stat.projectId, stat.projectName);
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

    /**
     * Affiche le modal avec les détails des sessions d'un projet
     * @param {string} projectId - ID du projet
     * @param {string} projectName - Nom du projet
     */
    async showSessionDetails(projectId, projectName) {
        if (!this.elements.modal || !this.onGetSessionsForProject) return;

        // Mettre à jour le titre du modal
        if (this.elements.modalProjectName) {
            this.elements.modalProjectName.textContent = `Détails : ${projectName}`;
        }

        // Récupérer les sessions du projet
        const sessions = await this.onGetSessionsForProject(projectId);

        // Afficher les sessions
        this.#renderSessions(sessions);

        // Ouvrir le modal
        this.openModal();
    }

    /**
     * Affiche les sessions dans le modal
     * @param {ProjectSession[]} sessions - Liste des sessions
     * @private
     */
    #renderSessions(sessions) {
        if (!this.elements.sessionsList) return;

        // Vider le conteneur
        this.elements.sessionsList.innerHTML = '';

        if (!sessions || sessions.length === 0) {
            const emptyMessage = createElement('p', {
                class: 'sessions-list__empty'
            }, 'Aucune session pour ce projet aujourd\'hui');

            this.elements.sessionsList.appendChild(emptyMessage);
            return;
        }

        // Créer les éléments de session
        sessions.forEach((session, index) => {
            const sessionItem = this.#createSessionItem(session, index + 1);
            this.elements.sessionsList.appendChild(sessionItem);
        });
    }

    /**
     * Crée un élément de session
     * @param {ProjectSession} session - Session à afficher
     * @param {number} sessionNumber - Numéro de la session
     * @returns {HTMLElement}
     * @private
     */
    #createSessionItem(session, sessionNumber) {
        const isRunning = !session.endTime;
        const duration = session.getDuration();

        const item = createElement('div', {
            class: `session-item ${isRunning ? 'session-item--running' : ''}`
        });

        // En-tête avec durée et statut
        const header = createElement('div', {
            class: 'session-item__header'
        });

        const durationEl = createElement('div', {
            class: 'session-item__duration'
        }, formatDuration(duration));

        const status = createElement('div', {
            class: `session-item__status ${isRunning ? 'session-item__status--running' : ''}`
        });

        if (isRunning) {
            const icon = createElement('span', {
                class: 'session-item__status-icon'
            }, '▶️');
            const text = createElement('span', {}, 'En cours');
            status.appendChild(icon);
            status.appendChild(text);
        } else {
            status.textContent = 'Terminée';
        }

        header.appendChild(durationEl);
        header.appendChild(status);

        // Détails
        const details = createElement('div', {
            class: 'session-item__details'
        });

        // Numéro de session
        const sessionLabel = createElement('div', {
            class: 'session-item__label'
        }, 'Session :');
        const sessionValue = createElement('div', {
            class: 'session-item__value'
        }, `#${sessionNumber}`);

        // Heure de début
        const startLabel = createElement('div', {
            class: 'session-item__label'
        }, 'Début :');
        const startValue = createElement('div', {
            class: 'session-item__value'
        }, formatTime(session.startTime));

        // Heure de fin
        const endLabel = createElement('div', {
            class: 'session-item__label'
        }, 'Fin :');
        const endValue = createElement('div', {
            class: 'session-item__value'
        }, session.endTime ? formatTime(session.endTime) : 'En cours...');

        // Assembler les détails
        details.appendChild(sessionLabel);
        details.appendChild(sessionValue);
        details.appendChild(startLabel);
        details.appendChild(startValue);
        details.appendChild(endLabel);
        details.appendChild(endValue);

        // Assembler l'élément
        item.appendChild(header);
        item.appendChild(details);

        return item;
    }

    /**
     * Ouvre le modal
     */
    openModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('modal--visible');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Ferme le modal
     */
    closeModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('modal--visible');
            document.body.style.overflow = '';
        }
    }
}
