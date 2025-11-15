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
            addProjectInput: null
        };

        // Callbacks
        this.onAddProject = null;
        this.onUpdateName = null;
        this.onUpdateTime = null;
        this.onDeleteProject = null;
        this.onStartProject = null;
        this.onAddRetroactiveTime = null;
    }

    /**
     * Initialise les références aux éléments DOM
     */
    init() {
        this.elements.projectsList = document.getElementById('projects-list');
        this.elements.addProjectBtn = document.getElementById('add-project-btn');
        this.elements.addProjectInput = document.getElementById('new-project-name');

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
     */
    renderProjects(projects) {
        if (!this.elements.projectsList) return;

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
            const row = this.#createProjectRow(project);
            this.elements.projectsList.appendChild(row);
        });
    }

    /**
     * Crée une ligne du tableau pour un projet
     * @param {Project} project - Projet à afficher
     * @returns {HTMLElement} Élément tr
     * @private
     */
    #createProjectRow(project) {
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

        // Affichage du temps passé
        const timeDisplay = createElement('div', {
            class: 'projects-table__time'
        }, formatDuration(project.timeSpent));

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

        // Bouton modifier le temps
        const editTimeBtn = createElement('button', {
            class: 'projects-table__btn projects-table__btn--time',
            title: 'Modifier le temps'
        }, '⏱️');
        editTimeBtn.addEventListener('click', () => {
            this.#handleEditTime(project);
        });

        // Bouton ajouter du temps rétroactif
        const addRetroactiveBtn = createElement('button', {
            class: 'projects-table__btn projects-table__btn--retroactive',
            title: 'Ajouter du temps rétroactif'
        }, '📅');
        addRetroactiveBtn.addEventListener('click', () => {
            this.#handleAddRetroactiveTime(project);
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
        actionsContainer.appendChild(editTimeBtn);
        actionsContainer.appendChild(addRetroactiveBtn);
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
     * Gère la modification du temps d'un projet
     * @param {Project} project - Projet à modifier
     * @private
     */
    #handleEditTime(project) {
        const currentHours = Math.floor(project.timeSpent / (1000 * 60 * 60));
        const currentMinutes = Math.floor((project.timeSpent % (1000 * 60 * 60)) / (1000 * 60));

        const input = prompt(
            'Nouveau temps passé (format: HH:MM ou heures décimales):',
            `${currentHours}:${currentMinutes.toString().padStart(2, '0')}`
        );

        if (!input) return;

        // Parser le temps
        let timeInMs = 0;

        // Format HH:MM
        if (input.includes(':')) {
            const [hours, minutes] = input.split(':').map(s => parseInt(s.trim()));
            if (!isNaN(hours) && !isNaN(minutes)) {
                timeInMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
            }
        }
        // Format décimal (heures)
        else {
            const hours = parseFloat(input);
            if (!isNaN(hours)) {
                timeInMs = hours * 60 * 60 * 1000;
            }
        }

        if (timeInMs >= 0 && this.onUpdateTime) {
            this.onUpdateTime(project.id, timeInMs);
        } else {
            alert('Format invalide. Utilisez HH:MM ou un nombre d\'heures.');
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
