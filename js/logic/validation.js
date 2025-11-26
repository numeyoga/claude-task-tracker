'use strict';

import { Either } from '../core/monads.js';
import { ENTRY_TYPES } from '../model/entry.js';

/**
 * Validations fonctionnelles avec Either monad
 * Toutes les fonctions retournent Either.left(error) ou Either.right(value)
 */

/**
 * Valide un type de pointage
 * @param {string} type - Type à valider
 * @returns {Either} Either.left(error) ou Either.right(type)
 */
export const validateEntryType = (type) => {
    const validTypes = Object.values(ENTRY_TYPES);

    if (!type) {
        return Either.left('Le type de pointage est requis');
    }

    if (!validTypes.includes(type)) {
        return Either.left(
            `Type de pointage invalide: ${type}. Types valides: ${validTypes.join(', ')}`
        );
    }

    return Either.right(type);
};

/**
 * Valide un timestamp
 * @param {Date} timestamp - Timestamp à valider
 * @returns {Either} Either.left(error) ou Either.right(timestamp)
 */
export const validateTimestamp = (timestamp) => {
    if (!timestamp) {
        return Either.left('Le timestamp est requis');
    }

    if (!(timestamp instanceof Date)) {
        return Either.left('Le timestamp doit être un objet Date');
    }

    if (isNaN(timestamp.getTime())) {
        return Either.left('Le timestamp n\'est pas une date valide');
    }

    if (timestamp > new Date()) {
        return Either.left('Le timestamp ne peut pas être dans le futur');
    }

    return Either.right(timestamp);
};

/**
 * Valide un nom de projet
 * @param {string} name - Nom à valider
 * @returns {Either} Either.left(error) ou Either.right(name)
 */
export const validateProjectName = (name) => {
    if (!name) {
        return Either.left('Le nom du projet est requis');
    }

    const trimmedName = name.trim();

    if (trimmedName === '') {
        return Either.left('Le nom du projet ne peut pas être vide');
    }

    if (trimmedName.length > 100) {
        return Either.left('Le nom du projet ne peut pas dépasser 100 caractères');
    }

    return Either.right(trimmedName);
};

/**
 * Valide une durée (doit être positive)
 * @param {number} duration - Durée en millisecondes
 * @returns {Either} Either.left(error) ou Either.right(duration)
 */
export const validateDuration = (duration) => {
    if (duration === null || duration === undefined) {
        return Either.left('La durée est requise');
    }

    if (typeof duration !== 'number') {
        return Either.left('La durée doit être un nombre');
    }

    if (isNaN(duration)) {
        return Either.left('La durée n\'est pas un nombre valide');
    }

    if (duration < 0) {
        return Either.left('La durée ne peut pas être négative');
    }

    return Either.right(duration);
};

/**
 * Valide un ID (doit être une chaîne non vide)
 * @param {string} id - ID à valider
 * @returns {Either} Either.left(error) ou Either.right(id)
 */
export const validateId = (id) => {
    if (!id) {
        return Either.left('L\'ID est requis');
    }

    if (typeof id !== 'string') {
        return Either.left('L\'ID doit être une chaîne de caractères');
    }

    if (id.trim() === '') {
        return Either.left('L\'ID ne peut pas être vide');
    }

    return Either.right(id);
};

/**
 * Valide une date au format YYYY-MM-DD
 * @param {string} dateString - Date à valider
 * @returns {Either} Either.left(error) ou Either.right(dateString)
 */
export const validateDateString = (dateString) => {
    if (!dateString) {
        return Either.left('La date est requise');
    }

    if (typeof dateString !== 'string') {
        return Either.left('La date doit être une chaîne de caractères');
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
        return Either.left('La date doit être au format YYYY-MM-DD');
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return Either.left('La date n\'est pas valide');
    }

    return Either.right(dateString);
};

/**
 * Valide qu'une date de fin est après une date de début
 * @param {Date} startDate - Date de début
 * @param {Date} endDate - Date de fin
 * @returns {Either} Either.left(error) ou Either.right({startDate, endDate})
 */
export const validateDateRange = (startDate, endDate) => {
    return validateTimestamp(startDate)
        .flatMap(validStart =>
            validateTimestamp(endDate).flatMap(validEnd => {
                if (validEnd < validStart) {
                    return Either.left('La date de fin doit être après la date de début');
                }
                return Either.right({ startDate: validStart, endDate: validEnd });
            })
        );
};

/**
 * Valide une session de projet (start/end times cohérents)
 * @param {Object} session - Session à valider
 * @returns {Either} Either.left(error) ou Either.right(session)
 */
export const validateSession = (session) => {
    if (!session) {
        return Either.left('La session est requise');
    }

    return validateId(session.projectId)
        .flatMap(() => validateTimestamp(session.startTime))
        .flatMap(validStart => {
            if (session.endTime === null) {
                // Session en cours
                return Either.right(session);
            }

            return validateTimestamp(session.endTime).flatMap(validEnd => {
                if (validEnd < validStart) {
                    return Either.left('La date de fin doit être après la date de début');
                }
                return Either.right(session);
            });
        });
};

/**
 * Valide un objet TimeEntry complet
 * @param {Object} entry - Entrée à valider
 * @returns {Either} Either.left(error) ou Either.right(entry)
 */
export const validateTimeEntry = (entry) => {
    if (!entry) {
        return Either.left('L\'entrée est requise');
    }

    return validateId(entry.id)
        .flatMap(() => validateEntryType(entry.type))
        .flatMap(() => validateTimestamp(entry.timestamp))
        .flatMap(() => validateDateString(entry.date))
        .map(() => entry);
};

/**
 * Valide un objet Project complet
 * @param {Object} project - Projet à valider
 * @returns {Either} Either.left(error) ou Either.right(project)
 */
export const validateProject = (project) => {
    if (!project) {
        return Either.left('Le projet est requis');
    }

    return validateId(project.id)
        .flatMap(() => validateProjectName(project.name))
        .flatMap(() => validateDuration(project.timeSpent))
        .flatMap(() => validateTimestamp(project.createdAt))
        .flatMap(() => validateTimestamp(project.updatedAt))
        .map(() => project);
};

/**
 * Valide un tableau d'entrées (toutes doivent être valides)
 * @param {Array} entries - Entrées à valider
 * @returns {Either} Either.left(error) ou Either.right(entries)
 */
export const validateEntries = (entries) => {
    if (!Array.isArray(entries)) {
        return Either.left('Les entrées doivent être un tableau');
    }

    for (let i = 0; i < entries.length; i++) {
        const result = validateTimeEntry(entries[i]);
        if (result.isLeft()) {
            return Either.left(`Entrée ${i}: ${result._value}`);
        }
    }

    return Either.right(entries);
};

/**
 * Valide un tableau de projets (tous doivent être valides)
 * @param {Array} projects - Projets à valider
 * @returns {Either} Either.left(error) ou Either.right(projects)
 */
export const validateProjects = (projects) => {
    if (!Array.isArray(projects)) {
        return Either.left('Les projets doivent être un tableau');
    }

    for (let i = 0; i < projects.length; i++) {
        const result = validateProject(projects[i]);
        if (result.isLeft()) {
            return Either.left(`Projet ${i}: ${result._value}`);
        }
    }

    return Either.right(projects);
};

/**
 * Valide un tableau de sessions (toutes doivent être valides)
 * @param {Array} sessions - Sessions à valider
 * @returns {Either} Either.left(error) ou Either.right(sessions)
 */
export const validateSessions = (sessions) => {
    if (!Array.isArray(sessions)) {
        return Either.left('Les sessions doivent être un tableau');
    }

    for (let i = 0; i < sessions.length; i++) {
        const result = validateSession(sessions[i]);
        if (result.isLeft()) {
            return Either.left(`Session ${i}: ${result._value}`);
        }
    }

    return Either.right(sessions);
};
