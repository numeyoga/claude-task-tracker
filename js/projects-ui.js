'use strict';

import { formatDuration, createElement } from './utils.js';
import { AddRetroactiveTimePopover, AddProjectPopover } from './popover.js';

/**
 * Gestion de l'interface utilisateur pour les projets
 */
export class ProjectsUI {
    constructor() {
        this.elements = {
            projectsList: null,
            addProjectBtn: null,
            addTimeBtn: null
        };

        // Liste des projets (pour la popover de temps)
        this.projects = [];

        // Callbacks
        this.onAddProject = null;
        this.onUpdateName = null;
        this.onUpdateTime = null;
        this.onDeleteProject = null;
        this.onStartProject = null;
        this.onAddRetroactiveTime = null;
        this.onReorderProjects = null;
    }

    /**
     * Initialise les références aux éléments DOM
     */
    init() {
        this.elements.projectsList = document.getElementById('projects-list');
        this.elements.addProjectBtn = document.getElementById('add-project-btn');
        this.elements.addTimeBtn = document.getElementById('add-time-btn');

        // Écouteur pour ajouter un projet
        if (this.elements.addProjectBtn) {
            this.elements.addProjectBtn.addEventListener('click', () => {
                this.#showAddProjectPopover();
            });
        }

        // Écouteur pour ajouter du temps
        if (this.elements.addTimeBtn) {
            this.elements.addTimeBtn.addEventListener('click', () => {
                this.#showAddTimePopover();
            });
        }

        console.log('✅ ProjectsUI initialisée');
    }

    /**
     * Affiche la popover pour ajouter un projet
     * @private
     */
    #showAddProjectPopover() {
        const popover = new AddProjectPopover((name) => {
            if (this.onAddProject) {
                this.onAddProject(name);
            }
        });

        popover.show();
    }

    /**
     * Affiche la popover pour ajouter du temps
     * @private
     */
    #showAddTimePopover() {
        if (this.projects.length === 0) {
            alert('Aucun projet disponible. Veuillez d\'abord créer un projet.');
            return;
        }

        const popover = new AddRetroactiveTimePopover(this.projects, (data) => {
            if (this.onAddRetroactiveTime) {
                this.onAddRetroactiveTime(data);
            }
        });

        popover.show();
    }

    /**
     * Affiche la liste des projets
     * @param {Project[]} projects - Liste des projets
     * @param {ProjectSession[]} todaySessions - Sessions du jour
     */
    renderProjects(projects, todaySessions = []) {
        if (!this.elements.projectsList) return;

        // Sauvegarder la liste des projets
        this.projects = projects || [];

        // Vider la liste actuelle
        this.elements.projectsList.innerHTML = '';

        if (!projects || projects.length === 0) {
            const emptyDiv = createElement('div', {
                class: 'projects-grid__empty'
            }, 'Aucun projet');
            this.elements.projectsList.appendChild(emptyDiv);
            return;
        }

        // Créer les cartes de projet
        projects.forEach((project, index) => {
            const card = this.#createProjectCard(project, todaySessions, index);
            this.elements.projectsList.appendChild(card);
        });
    }

    /**
     * Crée une carte de projet
     * @param {Project} project - Projet à afficher
     * @param {ProjectSession[]} todaySessions - Sessions du jour
     * @param {number} index - Index du projet
     * @returns {HTMLElement} Élément div
     * @private
     */
    #createProjectCard(project, todaySessions = [], index) {
        const card = createElement('div', {
            class: 'project-card',
            dataset: {
                projectId: project.id,
                index: index
            },
            draggable: 'true'
        });

        // En-tête avec nom du projet
        const header = createElement('div', {
            class: 'project-card__header'
        });

        const nameDisplay = createElement('div', {
            class: 'project-card__name'
        }, project.name);

        header.appendChild(nameDisplay);

        // Calculer le temps passé aujourd'hui sur ce projet
        const dailyTime = this.#calculateDailyTime(project.id, todaySessions);

        // Affichage du temps passé aujourd'hui
        const timeDisplay = createElement('div', {
            class: 'project-card__time'
        }, formatDuration(dailyTime));

        // Conteneur des boutons
        const actionsContainer = createElement('div', {
            class: 'project-card__actions'
        });

        // Bouton démarrer le chronomètre
        const startBtn = createElement('button', {
            class: 'project-card__btn project-card__btn--start',
            title: 'Démarrer le chronomètre',
            dataset: { action: 'start', projectId: project.id }
        }, '▶️');
        startBtn.addEventListener('click', () => {
            this.#handleStart(project);
        });

        // Bouton modifier le nom
        const editNameBtn = createElement('button', {
            class: 'project-card__btn project-card__btn--edit',
            title: 'Modifier le nom'
        }, '✏️');
        editNameBtn.addEventListener('click', () => {
            this.#handleEditName(project);
        });

        // Bouton ajouter du temps rétroactif
        const addRetroactiveBtn = createElement('button', {
            class: 'project-card__btn project-card__btn--retroactive',
            title: 'Ajouter du temps'
        }, '📅');
        addRetroactiveBtn.addEventListener('click', () => {
            this.#handleAddRetroactiveTime(project);
        });

        // Bouton supprimer
        const deleteBtn = createElement('button', {
            class: 'project-card__btn project-card__btn--delete',
            title: 'Supprimer le projet'
        }, '🗑️');
        deleteBtn.addEventListener('click', () => {
            this.#handleDelete(project);
        });

        actionsContainer.appendChild(startBtn);
        actionsContainer.appendChild(editNameBtn);
        actionsContainer.appendChild(addRetroactiveBtn);
        actionsContainer.appendChild(deleteBtn);

        card.appendChild(header);
        card.appendChild(timeDisplay);
        card.appendChild(actionsContainer);

        // Événements drag & drop
        this.#attachDragEvents(card);

        return card;
    }

    /**
     * Attache les événements de drag & drop à une carte
     * @param {HTMLElement} card - Carte de projet
     * @private
     */
    #attachDragEvents(card) {
        card.addEventListener('dragstart', (e) => {
            card.classList.add('project-card--dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', card.innerHTML);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('project-card--dragging');
            this.#saveProjectOrder();
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const afterElement = this.#getDragAfterElement(e.clientY);
            const draggingCard = document.querySelector('.project-card--dragging');

            if (afterElement == null) {
                this.elements.projectsList.appendChild(draggingCard);
            } else {
                this.elements.projectsList.insertBefore(draggingCard, afterElement);
            }
        });
    }

    /**
     * Détermine l'élément après lequel insérer la carte en cours de drag
     * @param {number} y - Position Y de la souris
     * @returns {HTMLElement|null} Élément après lequel insérer
     * @private
     */
    #getDragAfterElement(y) {
        const draggableElements = [...this.elements.projectsList.querySelectorAll('.project-card:not(.project-card--dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    /**
     * Sauvegarde l'ordre des projets après drag & drop
     * @private
     */
    #saveProjectOrder() {
        if (!this.onReorderProjects) return;

        const cards = [...this.elements.projectsList.querySelectorAll('.project-card')];
        const projectIds = cards.map(card => card.dataset.projectId);

        this.onReorderProjects(projectIds);
    }

    /**
     * Gère le démarrage du chronomètre pour un projet
     * @param {Project} project - Projet à démarrer
     * @private
     */
    #handleStart(project) {
        if (this.onStartProject) {
            this.onStartProject(project.id);
        }
    }

    /**
     * Gère la modification du nom d'un projet
     * @param {Project} project - Projet à modifier
     * @private
     */
    #handleEditName(project) {
        const newName = prompt('Nouveau nom du projet:', project.name);
        if (newName && newName.trim() !== '' && newName !== project.name) {
            if (this.onUpdateName) {
                this.onUpdateName(project.id, newName.trim());
            }
        }
    }

    /**
     * Gère la suppression d'un projet
     * @param {Project} project - Projet à supprimer
     * @private
     */
    #handleDelete(project) {
        const confirm = window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`);
        if (confirm && this.onDeleteProject) {
            this.onDeleteProject(project.id);
        }
    }

    /**
     * Gère l'ajout de temps rétroactif
     * @param {Project} project - Projet auquel ajouter du temps
     * @private
     */
    #handleAddRetroactiveTime(project) {
        // Créer et afficher la popover
        const popover = new AddRetroactiveTimePopover(project, (data) => {
            if (this.onAddRetroactiveTime) {
                this.onAddRetroactiveTime(data);
            }
        });

        popover.show();
    }

    /**
     * Calcule le temps passé aujourd'hui sur un projet
     * @param {string} projectId - ID du projet
     * @param {ProjectSession[]} todaySessions - Sessions du jour
     * @returns {number} Temps en millisecondes
     * @private
     */
    #calculateDailyTime(projectId, todaySessions) {
        if (!todaySessions || todaySessions.length === 0) {
            return 0;
        }

        // Filtrer les sessions du projet
        const projectSessions = todaySessions.filter(session => session.projectId === projectId);

        // Calculer le temps total
        return projectSessions.reduce((total, session) => {
            return total + session.getDuration();
        }, 0);
    }

    /**
     * Affiche un message d'erreur
     * @param {string} message - Message à afficher
     */
    showError(message) {
        alert(`Erreur: ${message}`);
    }

    /**
     * Affiche un message de succès
     * @param {string} message - Message à afficher
     */
    showSuccess(message) {
        // Utiliser le système de toast existant
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
}
