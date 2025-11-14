/**
 * Claude Time Tracker
 * Application principale
 */

'use strict';

import { StorageService } from './js/storage.js';
import { TimeEntry, ENTRY_TYPES } from './js/time-entry.js';
import { TimeCalculator } from './js/calculator.js';
import { TimeTrackerUI } from './js/ui.js';
import { getTodayDateString } from './js/utils.js';
import { Project } from './js/project.js';
import { ProjectsUI } from './js/projects-ui.js';
import { ProjectTimer } from './js/timer.js';
import { ProjectTimerUI } from './js/project-timer-ui.js';

/**
 * Contrôleur principal de l'application
 */
class App {
    constructor() {
        // Services
        this.storage = new StorageService();
        this.calculator = new TimeCalculator();
        this.ui = new TimeTrackerUI();
        this.projectsUI = new ProjectsUI();
        this.timer = null; // Initialisé après storage
        this.timerUI = new ProjectTimerUI();

        // État
        this.todayEntries = [];
        this.projects = [];
        this.todaySessions = [];
        this.updateInterval = null;

        // Initialisation
        this.init();
    }

    /**
     * Initialise l'application
     */
    async init() {
        try {
            console.log('🚀 Claude Time Tracker - Démarrage...');

            // Initialiser IndexedDB
            await this.storage.init();

            // Initialiser le timer
            this.timer = new ProjectTimer(this.storage);
            await this.timer.init();

            // Initialiser l'UI
            this.ui.init();
            this.projectsUI.init();
            this.timerUI.init();

            // Charger les données du jour
            await this.loadTodayData();

            // Charger les projets
            await this.loadProjects();

            // Charger les sessions du jour
            await this.loadTodaySessions();

            // Configurer les écouteurs d'événements
            this.setupEventListeners();
            this.setupProjectsEventListeners();
            this.setupTimerEventListeners();

            // Démarrer la mise à jour en temps réel
            this.startRealtimeUpdate();

            console.log('✅ Application démarrée avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.ui.showError('Erreur lors du démarrage de l\'application');
        }
    }

    // ======================
    // Chargement des données
    // ======================

    /**
     * Charge les pointages du jour
     */
    async loadTodayData() {
        try {
            const today = getTodayDateString();
            this.todayEntries = await this.storage.getEntriesByDate(today);

            console.log(`📅 ${this.todayEntries.length} pointage(s) chargé(s) pour aujourd'hui`);

            this.updateUI();
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    /**
     * Charge les projets
     */
    async loadProjects() {
        try {
            this.projects = await this.storage.getAllProjects();

            console.log(`📁 ${this.projects.length} projet(s) chargé(s)`);

            this.updateProjectsUI();
        } catch (error) {
            console.error('❌ Erreur lors du chargement des projets:', error);
            throw error;
        }
    }

    /**
     * Charge les sessions de projet du jour
     */
    async loadTodaySessions() {
        try {
            const today = getTodayDateString();
            this.todaySessions = await this.storage.getSessionsByDate(today);

            console.log(`⏱️ ${this.todaySessions.length} session(s) chargée(s) pour aujourd'hui`);

            this.updateTimerUI();
        } catch (error) {
            console.error('❌ Erreur lors du chargement des sessions:', error);
            throw error;
        }
    }

    // ======================
    // Gestion des pointages
    // ======================

    /**
     * Enregistre un nouveau pointage
     * @param {string} entryType - Type de pointage (ENTRY_TYPES)
     */
    async recordEntry(entryType) {
        try {
            // Créer l'entrée
            const entry = new TimeEntry(entryType);

            // Sauvegarder dans IndexedDB
            await this.storage.saveEntry(entry);

            // Ajouter à la liste locale
            this.todayEntries.push(entry);

            // Mettre à jour l'UI
            this.updateUI();

            // Afficher un message de succès
            const labels = {
                [ENTRY_TYPES.CLOCK_IN]: 'Arrivée enregistrée',
                [ENTRY_TYPES.LUNCH_START]: 'Début de pause enregistré',
                [ENTRY_TYPES.LUNCH_END]: 'Fin de pause enregistrée',
                [ENTRY_TYPES.CLOCK_OUT]: 'Départ enregistré'
            };

            this.ui.showSuccess(labels[entryType] || 'Pointage enregistré');

            console.log('✅ Pointage enregistré:', entryType);
        } catch (error) {
            console.error('❌ Erreur lors de l\'enregistrement:', error);
            this.ui.showError('Erreur lors de l\'enregistrement du pointage');
        }
    }

    // ======================
    // Mise à jour de l'interface
    // ======================

    /**
     * Met à jour l'interface utilisateur avec les données actuelles
     */
    updateUI() {
        // Calculer le temps de présence
        const presenceTime = this.calculator.calculatePresenceTime(this.todayEntries);
        const percentage = this.calculator.getCompletionPercentage(presenceTime);
        const remainingTime = this.calculator.getRemainingTime(presenceTime);

        // Mettre à jour l'affichage du temps
        this.ui.updatePresenceDisplay(presenceTime, percentage, remainingTime);

        // Déterminer l'état du jour
        const dayStatus = this.calculator.getDayStatus(this.todayEntries);
        this.ui.updateDayStatus(dayStatus);

        // Déterminer le prochain pointage attendu
        const nextEntry = this.calculator.getNextExpectedEntry(this.todayEntries);
        this.ui.updateButtons(nextEntry);

        // Afficher la liste des pointages
        this.ui.renderEntries(this.todayEntries);
    }

    /**
     * Démarre la mise à jour en temps réel (toutes les secondes)
     * Utile pour afficher le temps qui s'écoule pendant la journée
     */
    startRealtimeUpdate() {
        // Mettre à jour toutes les secondes
        this.updateInterval = setInterval(() => {
            const dayStatus = this.calculator.getDayStatus(this.todayEntries);

            // Seulement si la journée est en cours (pas terminée)
            if (dayStatus !== 'completed' && dayStatus !== 'not-started') {
                const presenceTime = this.calculator.calculatePresenceTime(this.todayEntries);
                const percentage = this.calculator.getCompletionPercentage(presenceTime);
                const remainingTime = this.calculator.getRemainingTime(presenceTime);

                this.ui.updatePresenceDisplay(presenceTime, percentage, remainingTime);
            }
        }, 1000);
    }

    // ======================
    // Gestion des projets
    // ======================

    /**
     * Met à jour l'interface utilisateur des projets
     */
    updateProjectsUI() {
        this.projectsUI.renderProjects(this.projects);
    }

    /**
     * Ajoute un nouveau projet
     * @param {string} name - Nom du projet
     */
    async addProject(name) {
        try {
            // Créer le projet
            const project = new Project(name);

            // Sauvegarder dans IndexedDB
            await this.storage.saveProject(project);

            // Ajouter à la liste locale
            this.projects.unshift(project);

            // Mettre à jour l'UI
            this.updateProjectsUI();

            this.projectsUI.showSuccess(`Projet "${name}" ajouté avec succès`);

            console.log('✅ Projet ajouté:', name);
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout du projet:', error);
            this.projectsUI.showError('Erreur lors de l\'ajout du projet');
        }
    }

    /**
     * Met à jour le nom d'un projet
     * @param {string} projectId - ID du projet
     * @param {string} newName - Nouveau nom
     */
    async updateProjectName(projectId, newName) {
        try {
            const project = this.projects.find(p => p.id === projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            project.updateName(newName);

            await this.storage.saveProject(project);

            this.updateProjectsUI();

            this.projectsUI.showSuccess(`Nom du projet modifié`);

            console.log('✅ Nom du projet modifié:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors de la modification du nom:', error);
            this.projectsUI.showError('Erreur lors de la modification du nom');
        }
    }

    /**
     * Met à jour le temps d'un projet
     * @param {string} projectId - ID du projet
     * @param {number} timeSpent - Nouveau temps en millisecondes
     */
    async updateProjectTime(projectId, timeSpent) {
        try {
            const project = this.projects.find(p => p.id === projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            project.updateTimeSpent(timeSpent);

            await this.storage.saveProject(project);

            this.updateProjectsUI();

            this.projectsUI.showSuccess(`Temps du projet modifié`);

            console.log('✅ Temps du projet modifié:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors de la modification du temps:', error);
            this.projectsUI.showError('Erreur lors de la modification du temps');
        }
    }

    /**
     * Supprime un projet
     * @param {string} projectId - ID du projet à supprimer
     */
    async deleteProject(projectId) {
        try {
            await this.storage.deleteProject(projectId);

            // Retirer de la liste locale
            this.projects = this.projects.filter(p => p.id !== projectId);

            this.updateProjectsUI();

            this.projectsUI.showSuccess('Projet supprimé');

            console.log('✅ Projet supprimé:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du projet:', error);
            this.projectsUI.showError('Erreur lors de la suppression du projet');
        }
    }

    // ======================
    // Gestion du chronomètre
    // ======================

    /**
     * Démarre le chronomètre pour un projet
     * @param {string} projectId - ID du projet
     */
    async startProject(projectId) {
        try {
            // Démarrer le timer (ou basculer si déjà en cours)
            if (this.timer.isRunning()) {
                await this.timer.switchTo(projectId);
                this.timerUI.showSuccess('Projet changé');
            } else {
                await this.timer.start(projectId);
                this.timerUI.showSuccess('Chronomètre démarré');
            }

            // Recharger les sessions et mettre à jour l'UI
            await this.loadTodaySessions();

            console.log('✅ Chronomètre démarré pour le projet:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors du démarrage du chronomètre:', error);
            this.timerUI.showError(error.message || 'Erreur lors du démarrage du chronomètre');
        }
    }

    /**
     * Arrête le chronomètre en cours
     */
    async stopTimer() {
        try {
            const session = await this.timer.stop();

            if (session) {
                // Recharger les sessions
                await this.loadTodaySessions();

                this.timerUI.showSuccess('Chronomètre arrêté');

                console.log('✅ Chronomètre arrêté');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'arrêt du chronomètre:', error);
            this.timerUI.showError(error.message || 'Erreur lors de l\'arrêt du chronomètre');
        }
    }

    /**
     * Met à jour l'interface du chronomètre
     */
    updateTimerUI() {
        // Mettre à jour l'affichage du timer
        const currentProjectId = this.timer ? this.timer.getCurrentProjectId() : null;

        if (currentProjectId) {
            const project = this.projects.find(p => p.id === currentProjectId);
            const duration = this.timer.getElapsedTime();

            this.timerUI.updateTimer(currentProjectId, project?.name, duration);
            this.timerUI.updateCurrentProjectIndicator(currentProjectId);
        } else {
            this.timerUI.updateTimer(null, null, 0);
            this.timerUI.updateCurrentProjectIndicator(null);
        }

        // Calculer et afficher les statistiques
        const stats = this.calculator.calculateProjectStats(this.todaySessions, this.projects);
        this.timerUI.renderStats(stats);
    }

    // ======================
    // Écouteurs d'événements
    // ======================

    /**
     * Configure les écouteurs d'événements des boutons
     */
    setupEventListeners() {
        // Bouton Arrivée
        this.ui.onButtonClick(ENTRY_TYPES.CLOCK_IN, () => {
            this.recordEntry(ENTRY_TYPES.CLOCK_IN);
        });

        // Bouton Début pause
        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_START, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_START);
        });

        // Bouton Fin pause
        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_END, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_END);
        });

        // Bouton Départ
        this.ui.onButtonClick(ENTRY_TYPES.CLOCK_OUT, () => {
            this.recordEntry(ENTRY_TYPES.CLOCK_OUT);
        });

        console.log('✅ Écouteurs d\'événements configurés');
    }

    /**
     * Configure les écouteurs d'événements pour les projets
     */
    setupProjectsEventListeners() {
        // Ajout d'un projet
        this.projectsUI.onAddProject = (name) => {
            this.addProject(name);
        };

        // Modification du nom
        this.projectsUI.onUpdateName = (projectId, newName) => {
            this.updateProjectName(projectId, newName);
        };

        // Modification du temps
        this.projectsUI.onUpdateTime = (projectId, timeSpent) => {
            this.updateProjectTime(projectId, timeSpent);
        };

        // Suppression
        this.projectsUI.onDeleteProject = (projectId) => {
            this.deleteProject(projectId);
        };

        // Démarrage du chronomètre
        this.projectsUI.onStartProject = (projectId) => {
            this.startProject(projectId);
        };

        console.log('✅ Écouteurs d\'événements des projets configurés');
    }

    /**
     * Configure les écouteurs d'événements pour le chronomètre
     */
    setupTimerEventListeners() {
        // Mise à jour du timer (appelé chaque seconde)
        this.timer.onTick = (projectId, elapsed) => {
            const project = this.projects.find(p => p.id === projectId);
            this.timerUI.updateTimer(projectId, project?.name, elapsed);

            // Mettre à jour les statistiques aussi (pour la session en cours)
            const stats = this.calculator.calculateProjectStats(this.todaySessions, this.projects);
            this.timerUI.renderStats(stats);
        };

        // Démarrage du timer
        this.timer.onStart = (projectId) => {
            this.updateTimerUI();
        };

        // Arrêt du timer
        this.timer.onStop = (projectId) => {
            this.updateTimerUI();
        };

        // Bouton d'arrêt du timer
        this.timerUI.onStopTimer = () => {
            this.stopTimer();
        };

        console.log('✅ Écouteurs d\'événements du chronomètre configurés');
    }
}

// Démarrage de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
