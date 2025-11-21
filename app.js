/**
 * Claude Time Tracker
 * Application principale
 */

'use strict';

import { StorageService } from './js/storage.js';
import { TimeEntry, ENTRY_TYPES, isBreakStart, isBreakEnd } from './js/time-entry.js';
import { TimeCalculator } from './js/calculator.js';
import { TimeTrackerUI } from './js/ui.js';
import { getTodayDateString } from './js/utils.js';
import { Project } from './js/project.js';
import { ProjectSession } from './js/project-session.js';
import { ProjectsUI } from './js/projects-ui.js';
import { ProjectTimer } from './js/timer.js';
import { ProjectTimerUI } from './js/project-timer-ui.js';
import { WeeklyReportCalculator } from './js/weekly-report.js';
import { ReportsUI } from './js/reports-ui.js';
import { EntriesManagementUI } from './js/entries-management-ui.js';
import { SessionsManagementUI } from './js/sessions-management-ui.js';
import { EditSessionPopover } from './js/popover.js';
import { DayTimeline } from './js/day-timeline.js';

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
        this.reportCalculator = new WeeklyReportCalculator();
        this.reportsUI = new ReportsUI();
        this.entriesManagementUI = new EntriesManagementUI();
        this.sessionsManagementUI = new SessionsManagementUI();
        this.dayTimeline = new DayTimeline();

        // État
        this.todayEntries = [];
        this.projects = [];
        this.todaySessions = [];
        this.updateInterval = null;

        // État des rapports
        this.currentPeriodType = 'week'; // 'week' ou 'month'
        this.currentPeriodStart = null;
        this.currentPeriodEnd = null;
        this.currentReport = null;

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
            this.reportsUI.init();
            this.entriesManagementUI.init();
            this.sessionsManagementUI.init();
            this.dayTimeline.init();

            // Charger les données du jour
            await this.loadTodayData();

            // Charger les projets
            await this.loadProjects();

            // Charger les sessions du jour
            await this.loadTodaySessions();

            // Initialiser et charger le rapport de la semaine courante
            await this.loadCurrentReport();

            // Configurer les écouteurs d'événements
            this.setupEventListeners();
            this.setupProjectsEventListeners();
            this.setupTimerEventListeners();
            this.setupReportsEventListeners();
            this.setupEntriesManagementEventListeners();

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
            // Si on démarre une pause, arrêter le timer de projet en cours
            if (isBreakStart(entryType) && this.timer.isRunning()) {
                console.log('⏸️ Arrêt automatique du timer de projet lors de la pause');
                // Sauvegarder l'ID du projet actif pour le redémarrer après la pause
                const projectId = this.timer.getCurrentProjectId();
                localStorage.setItem('pausedProjectId', projectId);
                console.log('💾 Projet sauvegardé pour reprise automatique:', projectId);

                await this.timer.stop();
                await this.updateProjectsUI();
            }

            // Si on pointe son départ, arrêter le timer de projet en cours
            if (entryType === ENTRY_TYPES.CLOCK_OUT && this.timer.isRunning()) {
                console.log('⏹️ Arrêt automatique du timer de projet lors du départ');
                await this.timer.stop();
                await this.loadTodaySessions();
            }

            // Si on termine une pause, redémarrer le projet qui était actif avant la pause
            if (isBreakEnd(entryType)) {
                const pausedProjectId = localStorage.getItem('pausedProjectId');
                if (pausedProjectId) {
                    console.log('▶️ Reprise automatique du projet après la pause:', pausedProjectId);
                    // Créer l'entrée d'abord
                    const entry = new TimeEntry(entryType);
                    await this.storage.saveEntry(entry);
                    this.todayEntries.push(entry);

                    // Ensuite redémarrer le projet
                    try {
                        await this.timer.start(pausedProjectId);
                        await this.loadTodaySessions();
                        await this.updateAllDisplays();

                        // Nettoyer le localStorage
                        localStorage.removeItem('pausedProjectId');

                        this.ui.showSuccess('Fin de pause enregistrée - Projet redémarré');
                        console.log('✅ Pointage enregistré et projet redémarré:', entryType);
                    } catch (error) {
                        // Si le projet n'existe plus, ne pas bloquer
                        console.warn('⚠️ Impossible de redémarrer le projet:', error.message);
                        localStorage.removeItem('pausedProjectId');

                        await this.updateAllDisplays();
                        this.ui.showSuccess('Fin de pause enregistrée');
                        console.log('✅ Pointage enregistré:', entryType);
                    }
                    return;
                }
            }

            // Créer l'entrée
            const entry = new TimeEntry(entryType);

            // Sauvegarder dans IndexedDB
            await this.storage.saveEntry(entry);

            // Ajouter à la liste locale
            this.todayEntries.push(entry);

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            // Afficher un message de succès
            const labels = {
                [ENTRY_TYPES.CLOCK_IN]: 'Arrivée enregistrée',
                [ENTRY_TYPES.BREAK_START]: 'Début de pause enregistré',
                [ENTRY_TYPES.BREAK_END]: 'Fin de pause enregistrée',
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

    /**
     * Modifie l'heure d'un pointage existant
     * @param {TimeEntry} entry - Pointage à modifier
     */
    async editEntry(entry) {
        try {
            // Demander la nouvelle heure
            const currentTime = entry.timestamp.toTimeString().substring(0, 5); // HH:MM
            const newTimeStr = prompt(
                'Modifier l\'heure du pointage (format HH:MM):',
                currentTime
            );

            if (!newTimeStr) return;

            // Parser la nouvelle heure
            const [hours, minutes] = newTimeStr.split(':').map(s => parseInt(s.trim()));

            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                this.ui.showError('Format d\'heure invalide. Utilisez HH:MM');
                return;
            }

            // Créer un nouveau timestamp avec la nouvelle heure
            const newTimestamp = new Date(entry.timestamp);
            newTimestamp.setHours(hours, minutes, 0, 0);

            // Mettre à jour le pointage
            entry.updateTimestamp(newTimestamp);

            // Sauvegarder dans IndexedDB
            await this.storage.saveEntry(entry);

            // Recharger les données
            await this.loadTodayData();

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.ui.showSuccess('Pointage modifié');

            console.log('✅ Pointage modifié:', entry.id);
        } catch (error) {
            console.error('❌ Erreur lors de la modification:', error);
            this.ui.showError(error.message || 'Erreur lors de la modification du pointage');
        }
    }

    /**
     * Supprime un pointage
     * @param {TimeEntry} entry - Pointage à supprimer
     */
    async deleteEntry(entry) {
        try {
            const confirm = window.confirm('Êtes-vous sûr de vouloir supprimer ce pointage ?');
            if (!confirm) return;

            // Supprimer de IndexedDB
            await this.storage.deleteEntry(entry.id);

            // Retirer de la liste locale
            this.todayEntries = this.todayEntries.filter(e => e.id !== entry.id);

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.ui.showSuccess('Pointage supprimé');

            console.log('✅ Pointage supprimé:', entry.id);
        } catch (error) {
            console.error('❌ Erreur lors de la suppression:', error);
            this.ui.showError('Erreur lors de la suppression du pointage');
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

        // Déterminer les boutons à activer (support multi-pauses)
        const enabledButtons = this.calculator.getEnabledButtons(this.todayEntries);
        this.ui.updateButtons(enabledButtons);

        // Afficher la liste des pointages
        this.ui.renderEntries(this.todayEntries);
    }

    /**
     * Met à jour TOUS les affichages de l'application
     * Cette méthode doit être appelée à chaque modification de temps
     */
    async updateAllDisplays() {
        // Mettre à jour l'UI principale (temps de présence et pointages)
        this.updateUI();

        // Mettre à jour l'UI des projets (temps quotidien dans la liste)
        this.updateProjectsUI();

        // Mettre à jour l'UI du timer (statistiques et timer actif)
        this.updateTimerUI();

        // Si le modal est ouvert, le rafraîchir
        this.refreshModalIfOpen();

        // Rafraîchir le rapport hebdomadaire pour refléter les changements immédiatement
        await this.loadCurrentReport();
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
        this.projectsUI.renderProjects(this.projects, this.todaySessions);
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

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

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

            // Mettre à jour TOUS les affichages (important si le modal est ouvert)
            await this.updateAllDisplays();

            this.projectsUI.showSuccess(`Nom du projet modifié`);

            console.log('✅ Nom du projet modifié:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors de la modification du nom:', error);
            this.projectsUI.showError('Erreur lors de la modification du nom');
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

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.projectsUI.showSuccess('Projet supprimé');

            console.log('✅ Projet supprimé:', projectId);
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du projet:', error);
            this.projectsUI.showError('Erreur lors de la suppression du projet');
        }
    }

    /**
     * Ajoute du temps rétroactif à un projet
     * @param {Object} data - Données de la session {projectId, startTime, endTime, date}
     */
    async addRetroactiveTime(data) {
        try {
            const { projectId, startTime, endTime, date } = data;

            // Vérifier que le projet existe
            const project = this.projects.find(p => p.id === projectId);
            if (!project) {
                throw new Error('Projet non trouvé');
            }

            // Créer une session de projet avec les dates spécifiées
            const session = new ProjectSession(projectId, startTime, endTime);

            // Sauvegarder la session
            await this.storage.saveSession(session);

            // Calculer la durée de la session
            const duration = session.getDuration();

            // Ajouter le temps au projet
            project.addTime(duration);
            await this.storage.saveProject(project);

            // Recharger les données
            await this.loadProjects();
            await this.loadTodaySessions();

            // Si la session est pour aujourd'hui, recharger les sessions du jour
            if (date === getTodayDateString()) {
                await this.loadTodaySessions();
            }

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.projectsUI.showSuccess(`Temps ajouté au projet "${project.name}"`);

            console.log('✅ Temps rétroactif ajouté:', projectId, duration);
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de temps rétroactif:', error);
            this.projectsUI.showError('Erreur lors de l\'ajout de temps rétroactif');
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

            // Recharger les sessions et mettre à jour TOUS les affichages
            await this.loadTodaySessions();
            await this.updateAllDisplays();

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
                // Recharger les sessions et mettre à jour TOUS les affichages
                await this.loadTodaySessions();
                await this.updateAllDisplays();

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

        // Mettre à jour la ligne de temps
        this.dayTimeline.update(this.todayEntries, this.todaySessions, this.projects);
    }

    /**
     * Récupère les sessions d'un projet pour aujourd'hui
     * @param {string} projectId - ID du projet
     * @returns {ProjectSession[]} - Sessions du projet
     */
    getSessionsForProject(projectId) {
        return this.todaySessions.filter(session => session.projectId === projectId);
    }

    /**
     * Édite une session de projet
     * @param {Object} data - Données de la session {sessionId, startTime, endTime}
     */
    async editSession(data) {
        try {
            const { sessionId, startTime, endTime } = data;

            // Trouver la session
            const session = this.todaySessions.find(s => s.id === sessionId);
            if (!session) {
                throw new Error('Session non trouvée');
            }

            // Mettre à jour la session
            session.startTime = startTime;
            session.endTime = endTime;

            // Sauvegarder dans IndexedDB
            await this.storage.saveSession(session);

            // Recharger les sessions
            await this.loadTodaySessions();

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.timerUI.showSuccess('Session modifiée');

            console.log('✅ Session modifiée:', sessionId);
        } catch (error) {
            console.error('❌ Erreur lors de la modification de la session:', error);
            this.timerUI.showError(error.message || 'Erreur lors de la modification de la session');
        }
    }

    /**
     * Modifie une session depuis l'interface de gestion
     * @param {ProjectSession} session - Session à modifier
     */
    async editSessionFromManagement(session) {
        try {
            // Trouver le nom du projet
            const project = this.projects.find(p => p.id === session.projectId);
            const projectName = project ? project.name : 'Projet inconnu';

            // Créer et afficher la popover d'édition
            const popover = new EditSessionPopover(session, projectName, async (data) => {
                try {
                    // Mettre à jour la session
                    session.startTime = data.startTime;
                    session.endTime = data.endTime;

                    // Sauvegarder dans IndexedDB
                    await this.storage.saveSession(session);

                    // Recharger toutes les sessions pour rafraîchir l'affichage
                    await this.loadAllSessions();

                    // Afficher un message de succès
                    this.sessionsManagementUI.showSuccess?.('Session modifiée') ||
                        this.timerUI.showSuccess('Session modifiée');

                    console.log('✅ Session modifiée:', session.id);
                } catch (error) {
                    console.error('❌ Erreur lors de la modification de la session:', error);
                    this.sessionsManagementUI.showError?.('Erreur lors de la modification de la session') ||
                        this.timerUI.showError('Erreur lors de la modification de la session');
                }
            });

            popover.show();
        } catch (error) {
            console.error('❌ Erreur lors de l\'ouverture du popover:', error);
            this.sessionsManagementUI.showError?.('Erreur lors de l\'ouverture du popover') ||
                this.timerUI.showError('Erreur lors de l\'ouverture du popover');
        }
    }

    /**
     * Supprime une session de projet
     * @param {string} sessionId - ID de la session à supprimer
     */
    async deleteSession(sessionId) {
        try {
            // Supprimer de IndexedDB
            await this.storage.deleteSession(sessionId);

            // Retirer de la liste locale
            this.todaySessions = this.todaySessions.filter(s => s.id !== sessionId);

            // Mettre à jour TOUS les affichages
            await this.updateAllDisplays();

            this.timerUI.showSuccess('Session supprimée');

            console.log('✅ Session supprimée:', sessionId);
        } catch (error) {
            console.error('❌ Erreur lors de la suppression de la session:', error);
            this.timerUI.showError('Erreur lors de la suppression de la session');
        }
    }

    /**
     * Rafraîchit le modal de détails s'il est ouvert
     */
    refreshModalIfOpen() {
        if (this.timerUI.isModalOpen()) {
            const { projectId, projectName } = this.timerUI.getOpenModalInfo();
            if (projectId) {
                // Rafraîchir le contenu du modal sans le fermer
                this.timerUI.refreshModalContent(projectId, projectName, this.getSessionsForProject(projectId));
            }
        }
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

        // Boutons Pause (nouveaux types génériques)
        this.ui.onButtonClick(ENTRY_TYPES.BREAK_START, () => {
            this.recordEntry(ENTRY_TYPES.BREAK_START);
        });

        this.ui.onButtonClick(ENTRY_TYPES.BREAK_END, () => {
            this.recordEntry(ENTRY_TYPES.BREAK_END);
        });

        // Boutons Pause (anciens types pour compatibilité)
        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_START, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_START);
        });

        this.ui.onButtonClick(ENTRY_TYPES.LUNCH_END, () => {
            this.recordEntry(ENTRY_TYPES.LUNCH_END);
        });

        // Bouton Départ
        this.ui.onButtonClick(ENTRY_TYPES.CLOCK_OUT, () => {
            this.recordEntry(ENTRY_TYPES.CLOCK_OUT);
        });

        // Modification d'un pointage
        this.ui.onEditEntry = (entry) => {
            this.editEntry(entry);
        };

        // Suppression d'un pointage
        this.ui.onDeleteEntry = (entry) => {
            this.deleteEntry(entry);
        };

        // Toggle de l'historique des pointages
        const toggleEntriesBtn = document.getElementById('toggle-entries-btn');
        const entriesList = document.getElementById('entries-list');
        const toggleIcon = document.getElementById('toggle-entries-icon');

        if (toggleEntriesBtn && entriesList && toggleIcon) {
            toggleEntriesBtn.addEventListener('click', () => {
                entriesList.classList.toggle('history-list--hidden');
                toggleIcon.textContent = entriesList.classList.contains('history-list--hidden') ? '▼' : '▲';
            });
        }

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

        // Suppression
        this.projectsUI.onDeleteProject = (projectId) => {
            this.deleteProject(projectId);
        };

        // Démarrage du chronomètre
        this.projectsUI.onStartProject = (projectId) => {
            this.startProject(projectId);
        };

        // Ajout de temps rétroactif
        this.projectsUI.onAddRetroactiveTime = (data) => {
            this.addRetroactiveTime(data);
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

            // Mettre à jour l'affichage du temps quotidien dans la liste des projets
            this.updateProjectsUI();

            // Rafraîchir le modal s'il est ouvert
            this.refreshModalIfOpen();
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

        // Récupération des sessions d'un projet pour affichage des détails
        this.timerUI.onGetSessionsForProject = async (projectId) => {
            return this.getSessionsForProject(projectId);
        };

        // Édition d'une session
        this.timerUI.onEditSession = (data) => {
            this.editSession(data);
        };

        // Suppression d'une session
        this.timerUI.onDeleteSession = (sessionId) => {
            this.deleteSession(sessionId);
        };

        console.log('✅ Écouteurs d\'événements du chronomètre configurés');
    }

    // ======================
    // Gestion des rapports (Phase 3)
    // ======================

    /**
     * Charge le rapport pour la période courante
     */
    async loadCurrentReport() {
        try {
            // Définir la période en fonction du type
            if (this.currentPeriodType === 'week') {
                this.currentPeriodStart = this.reportCalculator.getWeekStart();
                this.currentPeriodEnd = this.reportCalculator.getWeekEnd();
            } else {
                this.currentPeriodStart = this.reportCalculator.getMonthStart();
                this.currentPeriodEnd = this.reportCalculator.getMonthEnd();
            }

            // Charger toutes les données nécessaires pour la période
            const dateRange = this.reportCalculator.generateDateRange(this.currentPeriodStart, this.currentPeriodEnd);

            // Charger les entrées et sessions pour toute la période
            const allEntries = [];
            const allSessions = [];

            for (const date of dateRange) {
                const entries = await this.storage.getEntriesByDate(date);
                const sessions = await this.storage.getSessionsByDate(date);
                allEntries.push(...entries);
                allSessions.push(...sessions);
            }

            // Calculer les statistiques
            this.currentReport = this.reportCalculator.calculatePeriodStats({
                startDate: this.currentPeriodStart,
                endDate: this.currentPeriodEnd,
                entries: allEntries,
                sessions: allSessions,
                projects: this.projects
            });

            // Mettre à jour l'interface
            this.updateReportsUI();

            console.log('✅ Rapport chargé pour la période:', this.reportCalculator.formatDateRange(this.currentPeriodStart, this.currentPeriodEnd));
        } catch (error) {
            console.error('❌ Erreur lors du chargement du rapport:', error);
            this.reportsUI.showError('Erreur lors du chargement du rapport');
        }
    }

    /**
     * Met à jour l'interface utilisateur des rapports
     */
    updateReportsUI() {
        if (!this.currentReport) return;

        // Mettre à jour le label de la période
        const periodLabel = this.reportCalculator.formatDateRange(this.currentPeriodStart, this.currentPeriodEnd);
        this.reportsUI.updatePeriodLabel(periodLabel);

        // Mettre à jour les statistiques globales
        this.reportsUI.updateSummary(this.currentReport);

        // Afficher le tableau hebdomadaire
        this.reportsUI.renderWeeklyTable(this.currentReport, this.currentPeriodType);

        // Mettre à jour le bouton actif
        this.reportsUI.setActivePeriod(this.currentPeriodType);
    }

    /**
     * Change le type de période (semaine/mois)
     * @param {string} periodType - Type de période ('week' ou 'month')
     */
    async changePeriodType(periodType) {
        this.currentPeriodType = periodType;
        await this.loadCurrentReport();
    }

    /**
     * Navigue vers la période précédente ou suivante
     * @param {string} direction - Direction ('prev' ou 'next')
     */
    async navigatePeriod(direction) {
        const offset = direction === 'prev' ? -1 : 1;

        if (this.currentPeriodType === 'week') {
            // Déplacer d'une semaine
            this.currentPeriodStart.setDate(this.currentPeriodStart.getDate() + (offset * 7));
            this.currentPeriodEnd.setDate(this.currentPeriodEnd.getDate() + (offset * 7));
        } else {
            // Déplacer d'un mois
            this.currentPeriodStart.setMonth(this.currentPeriodStart.getMonth() + offset);
            this.currentPeriodEnd = this.reportCalculator.getMonthEnd(this.currentPeriodStart);
        }

        await this.loadCurrentReport();
    }

    /**
     * Configure les écouteurs d'événements pour les rapports
     */
    setupReportsEventListeners() {
        // Changement de type de période
        this.reportsUI.onPeriodTypeChange = (periodType) => {
            this.changePeriodType(periodType);
        };

        // Navigation de période
        this.reportsUI.onPeriodNavigate = (direction) => {
            this.navigatePeriod(direction);
        };

        console.log('✅ Écouteurs d\'événements des rapports configurés');
    }

    // ======================
    // Gestion des entrées (toutes)
    // ======================

    /**
     * Configure les écouteurs d'événements pour la gestion des entrées
     */
    setupEntriesManagementEventListeners() {
        // Bouton pour ouvrir la vue de gestion (toutes les entrées)
        const manageEntriesBtn = document.getElementById('manage-entries-btn');
        if (manageEntriesBtn) {
            manageEntriesBtn.addEventListener('click', () => {
                this.openEntriesManagement();
            });
        }

        // Bouton pour ouvrir la vue de gestion (entrées de la période)
        const managePeriodEntriesBtn = document.getElementById('manage-period-entries-btn');
        if (managePeriodEntriesBtn) {
            managePeriodEntriesBtn.addEventListener('click', () => {
                this.openPeriodEntriesManagement();
            });
        }

        // Rafraîchir les entrées
        this.entriesManagementUI.onRefresh = async () => {
            await this.loadAllEntries();
        };

        // Modifier une entrée
        this.entriesManagementUI.onEditEntry = (entry) => {
            this.editEntry(entry);
        };

        // Supprimer une entrée
        this.entriesManagementUI.onDeleteEntry = async (entry) => {
            await this.deleteEntry(entry);
            // Recharger les entrées après suppression
            await this.loadAllEntries();
        };

        // Callbacks pour la gestion des sessions de projet
        this.sessionsManagementUI.onRefresh = async () => {
            await this.loadAllSessions();
        };

        this.sessionsManagementUI.onEditSession = async (session) => {
            await this.editSessionFromManagement(session);
        };

        this.sessionsManagementUI.onDeleteSession = async (session) => {
            await this.deleteSession(session.id);
            // Recharger les sessions après suppression
            await this.loadAllSessions();
            // Recharger le rapport pour mettre à jour les statistiques
            await this.loadCurrentReport();
        };

        console.log('✅ Écouteurs d\'événements de la gestion des entrées configurés');
    }

    /**
     * Ouvre la vue de gestion des entrées (toutes)
     */
    async openEntriesManagement() {
        // Réinitialiser le filtre
        this.entriesManagementUI.clearPeriodFilter();
        this.entriesManagementUI.show();
        await this.loadAllEntries();
    }

    /**
     * Ouvre la vue de gestion des sessions de projet (période courante)
     */
    async openPeriodEntriesManagement() {
        // Définir le filtre de période
        const periodLabel = this.reportCalculator.formatDateRange(this.currentPeriodStart, this.currentPeriodEnd);
        this.sessionsManagementUI.setPeriodFilter({
            startDate: this.currentPeriodStart,
            endDate: this.currentPeriodEnd,
            label: periodLabel
        });

        this.sessionsManagementUI.show();
        await this.loadAllSessions();
    }

    /**
     * Charge toutes les entrées de la base de données
     */
    async loadAllEntries() {
        try {
            const allEntries = await this.storage.getAllEntries();
            this.entriesManagementUI.renderAllEntries(allEntries);

            console.log(`📋 ${allEntries.length} entrée(s) chargée(s) pour la gestion`);
        } catch (error) {
            console.error('❌ Erreur lors du chargement de toutes les entrées:', error);
            this.entriesManagementUI.showError('Erreur lors du chargement des entrées');
        }
    }

    /**
     * Charge toutes les sessions de projet de la base de données
     */
    async loadAllSessions() {
        try {
            const allSessions = await this.storage.getAllSessions();

            // Créer une Map des noms de projets
            const projectNames = new Map();
            this.projects.forEach(project => {
                projectNames.set(project.id, project.name);
            });

            this.sessionsManagementUI.renderAllSessions(allSessions, projectNames);

            console.log(`📋 ${allSessions.length} session(s) chargée(s) pour la gestion`);
        } catch (error) {
            console.error('❌ Erreur lors du chargement de toutes les sessions:', error);
            this.sessionsManagementUI.showError('Erreur lors du chargement des sessions');
        }
    }

}

// Démarrage de l'application au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
