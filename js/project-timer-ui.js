'use strict';

import { formatDuration, formatTime, createElement } from './utils.js';
import { EditSessionPopover } from './popover.js';

/**
 * Gestion de l'interface utilisateur pour le chronomètre de projet
 * Supporte le mode multi-projet avec plusieurs sessions simultanées
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
            closeModalBtn: null,
            // Nouveaux éléments pour le mode multi-projet
            multiProjectToggle: null,
            activeSessionsSection: null,
            activeSessionsList: null,
            activeSessionsCount: null,
            stopAllBtn: null
        };

        // État du modal
        this.modalState = {
            isOpen: false,
            projectId: null,
            projectName: null
        };

        // État multi-projet
        this.multiProjectMode = false;
        this.activeSessions = []; // Sessions actives en cours

        // Callbacks
        this.onStartProject = null;
        this.onStopTimer = null;
        this.onStopTimerForProject = null; // Callback pour arrêter un projet spécifique
        this.onStopAllTimers = null; // Callback pour arrêter tous les timers
        this.onToggleMultiProjectMode = null; // Callback pour le changement de mode
        this.onGetSessionsForProject = null;
        this.onEditSession = null;
        this.onDeleteSession = null;
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

        // Bouton pour arrêter tous les timers
        this.elements.stopAllBtn = document.getElementById('stop-all-timers-btn');
        if (this.elements.stopAllBtn) {
            this.elements.stopAllBtn.addEventListener('click', () => {
                if (this.onStopAllTimers) {
                    this.onStopAllTimers();
                }
            });
        }

        // Toggle du mode multi-projet
        this.elements.multiProjectToggle = document.getElementById('multi-project-toggle');
        if (this.elements.multiProjectToggle) {
            // Charger l'état initial depuis localStorage
            this.multiProjectMode = localStorage.getItem('multiProjectMode') === 'true';
            this.elements.multiProjectToggle.checked = this.multiProjectMode;
            this.#updateMultiProjectModeUI();

            this.elements.multiProjectToggle.addEventListener('change', (e) => {
                this.multiProjectMode = e.target.checked;
                this.#updateMultiProjectModeUI();

                if (this.onToggleMultiProjectMode) {
                    this.onToggleMultiProjectMode(this.multiProjectMode);
                }
            });
        }

        // Section des sessions actives
        this.elements.activeSessionsSection = document.getElementById('active-sessions');
        this.elements.activeSessionsList = document.getElementById('active-sessions-list');
        this.elements.activeSessionsCount = document.getElementById('active-sessions-count');

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
     * Met à jour l'UI selon le mode multi-projet
     * @private
     */
    #updateMultiProjectModeUI() {
        if (this.elements.timerDisplay) {
            if (this.multiProjectMode) {
                this.elements.timerDisplay.classList.add('timer-display-compact--multi-project');
            } else {
                this.elements.timerDisplay.classList.remove('timer-display-compact--multi-project');
            }
        }

        // Afficher/masquer le bouton "Tout arrêter"
        if (this.elements.stopAllBtn) {
            if (this.multiProjectMode && this.activeSessions.length > 1) {
                this.elements.stopAllBtn.classList.add('timer-compact__stop-all-btn--visible');
                this.elements.stopAllBtn.disabled = false;
            } else {
                this.elements.stopAllBtn.classList.remove('timer-compact__stop-all-btn--visible');
            }
        }
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
                // En mode multi-projet avec plusieurs sessions, afficher un texte différent
                if (this.multiProjectMode && this.activeSessions.length > 1) {
                    this.elements.timerProjectName.textContent = `${this.activeSessions.length} projets actifs`;
                } else {
                    this.elements.timerProjectName.textContent = projectName || 'Projet inconnu';
                }
            }

            if (this.elements.timerDuration) {
                // En mode multi-projet, afficher le temps total
                if (this.multiProjectMode && this.activeSessions.length > 1) {
                    const totalDuration = this.activeSessions.reduce((total, s) => total + s.duration, 0);
                    this.elements.timerDuration.textContent = formatDuration(totalDuration);
                } else {
                    this.elements.timerDuration.textContent = formatDuration(duration);
                }
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

        // Mettre à jour la section des sessions actives
        this.#updateActiveSessionsUI();
    }

    /**
     * Met à jour la liste des sessions actives avec les données actuelles
     * @param {Array} sessions - Liste des sessions actives [{projectId, projectName, duration}]
     */
    updateActiveSessions(sessions) {
        this.activeSessions = sessions;
        this.#updateActiveSessionsUI();
        this.#updateMultiProjectModeUI();
    }

    /**
     * Met à jour l'affichage de la section des sessions actives
     * @private
     */
    #updateActiveSessionsUI() {
        if (!this.elements.activeSessionsSection || !this.elements.activeSessionsList) return;

        // Afficher la section seulement si mode multi-projet et plusieurs sessions
        if (this.multiProjectMode && this.activeSessions.length > 1) {
            this.elements.activeSessionsSection.style.display = 'block';

            // Mettre à jour le compteur
            if (this.elements.activeSessionsCount) {
                this.elements.activeSessionsCount.textContent = this.activeSessions.length;
            }

            // Vider et reconstruire la liste
            this.elements.activeSessionsList.innerHTML = '';

            this.activeSessions.forEach(session => {
                const sessionItem = this.#createActiveSessionItem(session);
                this.elements.activeSessionsList.appendChild(sessionItem);
            });
        } else {
            this.elements.activeSessionsSection.style.display = 'none';
        }
    }

    /**
     * Crée un élément pour une session active
     * @param {Object} session - Session active {projectId, projectName, duration}
     * @returns {HTMLElement}
     * @private
     */
    #createActiveSessionItem(session) {
        const item = createElement('div', {
            class: 'active-session-item',
            dataset: {
                projectId: session.projectId
            }
        });

        // Indicateur de session active (point vert animé)
        const indicator = createElement('div', {
            class: 'active-session-item__indicator'
        });

        // Nom du projet
        const name = createElement('span', {
            class: 'active-session-item__name'
        }, session.projectName);

        // Durée
        const duration = createElement('span', {
            class: 'active-session-item__duration'
        }, formatDuration(session.duration));

        // Bouton d'arrêt
        const stopBtn = createElement('button', {
            class: 'active-session-item__stop-btn',
            title: 'Arrêter ce chronomètre'
        }, '⏹️');

        stopBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.onStopTimerForProject) {
                this.onStopTimerForProject(session.projectId);
            }
        });

        item.appendChild(indicator);
        item.appendChild(name);
        item.appendChild(duration);
        item.appendChild(stopBtn);

        return item;
    }

    /**
     * Met à jour l'indicateur du projet actif dans la liste
     * @param {string|null} currentProjectId - ID du projet en cours (ou tableau d'IDs)
     */
    updateCurrentProjectIndicator(currentProjectId) {
        // Retirer tous les indicateurs existants
        const allRows = document.querySelectorAll('.projects-table__row');
        allRows.forEach(row => {
            row.classList.remove('projects-table__row--active');
        });

        // Support pour un seul ID ou un tableau d'IDs
        const activeIds = Array.isArray(currentProjectId) ? currentProjectId :
            (currentProjectId ? [currentProjectId] : []);

        // Ajouter l'indicateur sur tous les projets actifs
        activeIds.forEach(projectId => {
            const activeRow = document.querySelector(`[data-project-id="${projectId}"]`);
            if (activeRow) {
                activeRow.classList.add('projects-table__row--active');
            }
        });
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
        const cardClasses = ['project-stat-card'];
        if (stat.isRunning) cardClasses.push('project-stat-card--running');
        if (stat.hasOverlap) cardClasses.push('project-stat-card--overlap');

        const card = createElement('div', {
            class: cardClasses.join(' '),
            dataset: {
                projectId: stat.projectId
            }
        });

        // Ajouter le gestionnaire de clic pour afficher les détails
        card.addEventListener('click', () => {
            this.showSessionDetails(stat.projectId, stat.projectName);
        });

        // Badge de chevauchement (si applicable)
        if (stat.hasOverlap) {
            const overlapBadge = createElement('div', {
                class: 'project-stat-card__overlap-badge',
                title: `Travail parallèle: ${formatDuration(stat.overlapDuration)}`
            }, '⚡');
            card.appendChild(overlapBadge);
        }

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

        // Indicateur de chevauchement (sous la durée)
        if (stat.hasOverlap && stat.overlapDuration > 0) {
            const overlapIndicator = createElement('div', {
                class: 'overlap-indicator'
            });
            const overlapIcon = createElement('span', {
                class: 'overlap-indicator__icon'
            }, '⚡');
            const overlapText = createElement('span', {}, formatDuration(stat.overlapDuration) + ' parallèle');
            overlapIndicator.appendChild(overlapIcon);
            overlapIndicator.appendChild(overlapText);
            card.appendChild(overlapIndicator);
        }

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

        // Sauvegarder les infos du modal
        this.modalState.projectId = projectId;
        this.modalState.projectName = projectName;

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

        // Boutons d'action
        const actionsContainer = createElement('div', {
            class: 'session-item__actions'
        });

        // Bouton modifier (seulement si la session est terminée)
        if (session.endTime) {
            const editBtn = createElement('button', {
                class: 'session-item__btn session-item__btn--edit',
                title: 'Modifier'
            }, '✏️');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.#handleEditSession(session, this.modalState.projectName);
            });
            actionsContainer.appendChild(editBtn);
        }

        // Bouton supprimer
        const deleteBtn = createElement('button', {
            class: 'session-item__btn session-item__btn--delete',
            title: 'Supprimer'
        }, '🗑️');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.#handleDeleteSession(session);
        });

        actionsContainer.appendChild(deleteBtn);

        // Assembler l'élément
        item.appendChild(header);
        item.appendChild(details);
        item.appendChild(actionsContainer);

        return item;
    }

    /**
     * Gère l'édition d'une session
     * @param {ProjectSession} session - Session à éditer
     * @param {string} projectName - Nom du projet
     * @private
     */
    #handleEditSession(session, projectName) {
        const popover = new EditSessionPopover(session, projectName, (data) => {
            if (this.onEditSession) {
                this.onEditSession(data);
            }
        });

        popover.show();
    }

    /**
     * Gère la suppression d'une session
     * @param {ProjectSession} session - Session à supprimer
     * @private
     */
    #handleDeleteSession(session) {
        const confirm = window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?');
        if (confirm && this.onDeleteSession) {
            this.onDeleteSession(session.id);
        }
    }

    /**
     * Ouvre le modal
     */
    openModal() {
        if (this.elements.modal) {
            this.modalState.isOpen = true;
            this.elements.modal.classList.add('modal--visible');
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Ferme le modal
     */
    closeModal() {
        if (this.elements.modal) {
            this.modalState.isOpen = false;
            this.modalState.projectId = null;
            this.modalState.projectName = null;
            this.elements.modal.classList.remove('modal--visible');
            document.body.style.overflow = '';
        }
    }

    /**
     * Vérifie si le modal est ouvert
     * @returns {boolean}
     */
    isModalOpen() {
        return this.modalState.isOpen;
    }

    /**
     * Récupère les informations du modal ouvert
     * @returns {{projectId: string|null, projectName: string|null}}
     */
    getOpenModalInfo() {
        return {
            projectId: this.modalState.projectId,
            projectName: this.modalState.projectName
        };
    }

    /**
     * Rafraîchit le contenu du modal sans le fermer
     * @param {string} projectId - ID du projet
     * @param {string} projectName - Nom du projet
     * @param {ProjectSession[]} sessions - Sessions du projet
     */
    refreshModalContent(projectId, projectName, sessions) {
        if (!this.isModalOpen() || !this.elements.modal) return;

        // Mettre à jour le titre si le nom a changé
        if (this.elements.modalProjectName) {
            this.elements.modalProjectName.textContent = `Détails : ${projectName}`;
        }

        // Rafraîchir la liste des sessions
        this.#renderSessions(sessions);

        // Mettre à jour l'état
        this.modalState.projectName = projectName;
    }
}
