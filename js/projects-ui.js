'use strict';

import { formatDuration, createElement } from './utils.js';
import { AddRetroactiveTimePopover } from './popover.js';

/**
 * Gestion de l'interface utilisateur pour les projets
 */
export class ProjectsUI {
    constructor() {
        this.elements = {
            projectsList: null,
            addProjectBtn: null,
            addProjectInput: null,
            addManualTimeBtn: null
        };

        // Callbacks
        this.onAddProject = null;
        this.onUpdateName = null;
        this.onDeleteProject = null;
        this.onStartProject = null;
        this.onAddRetroactiveTime = null;

        // Liste des projets pour le bouton d'ajout manuel
        this.projects = [];
    }

    /**
     * Initialise les références aux éléments DOM
     */
    init() {
        this.elements.projectsList = document.getElementById('projects-list');
        this.elements.addProjectBtn = document.getElementById('add-project-btn');
        this.elements.addProjectInput = document.getElementById('new-project-name');
        this.elements.addManualTimeBtn = document.getElementById('add-manual-time-btn');

        // Écouteur pour ajouter un projet
        if (this.elements.addProjectBtn) {
            this.elements.addProjectBtn.addEventListener('click', () => {
                this.#handleAddProject();
            });
        }

        // Écouteur pour ajouter un projet avec la touche Entrée
        if (this.elements.addProjectInput) {
            this.elements.addProjectInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.#handleAddProject();
                }
            });
        }

        // Écouteur pour ajouter du temps manuel
        if (this.elements.addManualTimeBtn) {
            this.elements.addManualTimeBtn.addEventListener('click', () => {
                this.#handleAddManualTime();
            });
        }

        console.log('✅ ProjectsUI initialisée');
    }

    /**
     * Gère l'ajout d'un nouveau projet
     * @private
     */
    #handleAddProject() {
        if (!this.elements.addProjectInput) return;

        const name = this.elements.addProjectInput.value.trim();
        if (!name) {
            return;
        }

        if (this.onAddProject) {
            this.onAddProject(name);
        }

        // Vider le champ
        this.elements.addProjectInput.value = '';
    }

    /**
     * Affiche la liste des projets
     * @param {Project[]} projects - Liste des projets
     * @param {ProjectSession[]} todaySessions - Sessions du jour
     */
    renderProjects(projects, todaySessions = []) {
        if (!this.elements.projectsList) return;

        // Stocker la liste des projets pour l'ajout manuel de temps
        this.projects = projects || [];

        // Vider la liste actuelle
        this.elements.projectsList.innerHTML = '';

        if (!projects || projects.length === 0) {
            const emptyRow = createElement('tr', {
                class: 'projects-table__empty'
            });
            const emptyCell = createElement('td', {
                colspan: '2'
            }, 'Aucun projet');
            emptyRow.appendChild(emptyCell);
            this.elements.projectsList.appendChild(emptyRow);
            return;
        }

        // Créer les lignes du tableau
        projects.forEach(project => {
            const row = this.#createProjectRow(project, todaySessions);
            this.elements.projectsList.appendChild(row);
        });
    }

    /**
     * Crée une ligne du tableau pour un projet
     * @param {Project} project - Projet à afficher
     * @param {ProjectSession[]} todaySessions - Sessions du jour
     * @returns {HTMLElement} Élément tr
     * @private
     */
    #createProjectRow(project, todaySessions = []) {
        const row = createElement('tr', {
            class: 'projects-table__row',
            dataset: { projectId: project.id }
        });

        // Colonne nom uniquement
        const nameCell = createElement('td', {
            class: 'projects-table__cell projects-table__cell--name'
        });

        const nameDisplay = createElement('div', {
            class: 'projects-table__name'
        }, project.name);

        nameCell.appendChild(nameDisplay);

        // Colonne actions
        const actionsCell = createElement('td', {
            class: 'projects-table__cell projects-table__cell--actions'
        });

        const actionsContainer = createElement('div', {
            class: 'projects-table__actions'
        });

        // Calculer le temps passé aujourd'hui sur ce projet
        const dailyTime = this.#calculateDailyTime(project.id, todaySessions);

        // Affichage du temps passé aujourd'hui
        const timeDisplay = createElement('div', {
            class: 'projects-table__time'
        }, formatDuration(dailyTime));

        // Bouton démarrer le chronomètre
        const startBtn = createElement('button', {
            class: 'projects-table__btn projects-table__btn--start',
            title: 'Démarrer le chronomètre',
            dataset: { action: 'start', projectId: project.id }
        }, '▶️');
        startBtn.addEventListener('click', () => {
            this.#handleStart(project);
        });

        // Bouton modifier le nom
        const editNameBtn = createElement('button', {
            class: 'projects-table__btn projects-table__btn--edit',
            title: 'Modifier le nom'
        }, '✏️');
        editNameBtn.addEventListener('click', () => {
            this.#handleEditName(project);
        });

        // Bouton supprimer
        const deleteBtn = createElement('button', {
            class: 'projects-table__btn projects-table__btn--delete',
            title: 'Supprimer le projet'
        }, '🗑️');
        deleteBtn.addEventListener('click', () => {
            this.#handleDelete(project);
        });

        actionsContainer.appendChild(timeDisplay);
        actionsContainer.appendChild(startBtn);
        actionsContainer.appendChild(editNameBtn);
        actionsContainer.appendChild(deleteBtn);
        actionsCell.appendChild(actionsContainer);

        row.appendChild(nameCell);
        row.appendChild(actionsCell);

        return row;
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
     * Gère l'ajout de temps manuel (global, avec sélecteur de projet)
     * @private
     */
    #handleAddManualTime() {
        if (!this.projects || this.projects.length === 0) {
            alert('Aucun projet disponible. Veuillez d\'abord créer un projet.');
            return;
        }

        // Créer et afficher la popover avec tous les projets
        const popover = new AddRetroactiveTimePopover(this.projects, (data) => {
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
