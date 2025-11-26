'use strict';

/**
 * Messages (Actions) de l'application
 * Toutes les actions possibles dans l'application
 * Pattern: Msg.ActionName(params)
 */

export const Msg = Object.freeze({
    // ===== Initialisation =====
    Init: () => ({ type: 'INIT' }),

    // ===== Pointage =====
    ClockIn: () => ({ type: 'CLOCK_IN' }),
    ClockOut: () => ({ type: 'CLOCK_OUT' }),
    BreakStart: () => ({ type: 'BREAK_START' }),
    BreakEnd: () => ({ type: 'BREAK_END' }),

    // ===== Projets =====
    StartSession: (projectId) => ({ type: 'START_SESSION', projectId }),
    StopSession: () => ({ type: 'STOP_SESSION' }),
    SwitchProject: (projectId) => ({ type: 'SWITCH_PROJECT', projectId }),
    AddProject: (name) => ({ type: 'ADD_PROJECT', name }),
    UpdateProject: (projectId, name) => ({ type: 'UPDATE_PROJECT', projectId, name }),
    DeleteProject: (projectId) => ({ type: 'DELETE_PROJECT', projectId }),

    // ===== Navigation =====
    ChangeView: (view) => ({ type: 'CHANGE_VIEW', view }),
    ChangeDate: (date) => ({ type: 'CHANGE_DATE', date }),

    // ===== Chargement des données (effets) =====
    EntriesLoaded: (entries) => ({ type: 'ENTRIES_LOADED', entries }),
    ProjectsLoaded: (projects) => ({ type: 'PROJECTS_LOADED', projects }),
    SessionsLoaded: (sessions) => ({ type: 'SESSIONS_LOADED', sessions }),
    CurrentSessionLoaded: (session) => ({ type: 'CURRENT_SESSION_LOADED', session }),

    // ===== Timer =====
    TimerTick: (elapsed) => ({ type: 'TIMER_TICK', elapsed }),

    // ===== Gestion des entrées =====
    EditEntry: (entryId) => ({ type: 'EDIT_ENTRY', entryId }),
    DeleteEntry: (entryId) => ({ type: 'DELETE_ENTRY', entryId }),
    UpdateEntry: (entryId, timestamp) => ({ type: 'UPDATE_ENTRY', entryId, timestamp }),

    // ===== Gestion des sessions =====
    EditSession: (sessionId) => ({ type: 'EDIT_SESSION', sessionId }),
    DeleteSession: (sessionId) => ({ type: 'DELETE_SESSION', sessionId }),
    UpdateSession: (sessionId, startTime, endTime) => ({
        type: 'UPDATE_SESSION',
        sessionId,
        startTime,
        endTime
    }),

    // ===== Popovers / Modals =====
    ShowProjectSelector: () => ({ type: 'SHOW_PROJECT_SELECTOR' }),
    ShowAddProject: () => ({ type: 'SHOW_ADD_PROJECT' }),
    ShowEditEntry: (entryId) => ({ type: 'SHOW_EDIT_ENTRY', entryId }),
    ShowEditSession: (sessionId) => ({ type: 'SHOW_EDIT_SESSION', sessionId }),
    ClosePopover: () => ({ type: 'CLOSE_POPOVER' }),

    // ===== Loading =====
    SetLoading: (isLoading) => ({ type: 'SET_LOADING', isLoading }),

    // ===== Erreurs et succès =====
    Error: (message) => ({ type: 'ERROR', message }),
    Success: (message) => ({ type: 'SUCCESS', message }),
    ClearError: () => ({ type: 'CLEAR_ERROR' }),
    ClearSuccess: () => ({ type: 'CLEAR_SUCCESS' }),

    // ===== Rapports =====
    ChangePeriod: (periodType) => ({ type: 'CHANGE_PERIOD', periodType }),
    PreviousPeriod: () => ({ type: 'PREVIOUS_PERIOD' }),
    NextPeriod: () => ({ type: 'NEXT_PERIOD' }),
    ReportDataLoaded: (reportData) => ({ type: 'REPORT_DATA_LOADED', reportData }),

    // ===== Refresh =====
    RefreshData: () => ({ type: 'REFRESH_DATA' }),
    RefreshStats: () => ({ type: 'REFRESH_STATS' })
});
