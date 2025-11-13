'use strict';

/**
 * Framework de tests minimaliste
 */
export class TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    /**
     * Enregistre un test
     * @param {string} description - Description du test
     * @param {Function} testFn - Fonction de test
     */
    test(description, testFn) {
        this.tests.push({ description, testFn });
    }

    /**
     * Exécute tous les tests
     */
    async run() {
        console.log('🧪 Exécution des tests...\n');

        for (const test of this.tests) {
            this.results.total++;

            try {
                await test.testFn();
                this.results.passed++;
                console.log(`✅ ${test.description}`);
            } catch (error) {
                this.results.failed++;
                console.error(`❌ ${test.description}`);
                console.error(`   ${error.message}`);
                if (error.stack) {
                    console.error(`   ${error.stack.split('\n')[1]}`);
                }
            }
        }

        this.printSummary();
    }

    /**
     * Affiche le résumé des tests
     */
    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log(`Tests: ${this.results.passed}/${this.results.total} réussis`);

        if (this.results.failed > 0) {
            console.log(`❌ ${this.results.failed} test(s) échoué(s)`);
        } else {
            console.log('✅ Tous les tests sont passés !');
        }
    }
}

/**
 * Assertions
 */
export class Assert {
    static equal(actual, expected, message = '') {
        if (actual !== expected) {
            throw new Error(
                message || `Expected ${expected}, but got ${actual}`
            );
        }
    }

    static notEqual(actual, expected, message = '') {
        if (actual === expected) {
            throw new Error(
                message || `Expected not to be ${expected}`
            );
        }
    }

    static deepEqual(actual, expected, message = '') {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);

        if (actualStr !== expectedStr) {
            throw new Error(
                message || `Expected ${expectedStr}, but got ${actualStr}`
            );
        }
    }

    static isTrue(value, message = '') {
        if (value !== true) {
            throw new Error(
                message || `Expected true, but got ${value}`
            );
        }
    }

    static isFalse(value, message = '') {
        if (value !== false) {
            throw new Error(
                message || `Expected false, but got ${value}`
            );
        }
    }

    static throws(fn, expectedError, message = '') {
        try {
            fn();
            throw new Error(message || 'Expected function to throw');
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new Error(
                    message || `Expected ${expectedError.name}, but got ${error.name}`
                );
            }
        }
    }

    static async rejects(promise, expectedError, message = '') {
        try {
            await promise;
            throw new Error(message || 'Expected promise to reject');
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new Error(
                    message || `Expected ${expectedError.name}, but got ${error.name}`
                );
            }
        }
    }

    static isNull(value, message = '') {
        if (value !== null) {
            throw new Error(
                message || `Expected null, but got ${value}`
            );
        }
    }

    static isNotNull(value, message = '') {
        if (value === null) {
            throw new Error(
                message || 'Expected value not to be null'
            );
        }
    }

    static isUndefined(value, message = '') {
        if (value !== undefined) {
            throw new Error(
                message || `Expected undefined, but got ${value}`
            );
        }
    }

    static isDefined(value, message = '') {
        if (value === undefined) {
            throw new Error(
                message || 'Expected value to be defined'
            );
        }
    }

    static instanceOf(obj, constructor, message = '') {
        if (!(obj instanceof constructor)) {
            throw new Error(
                message || `Expected instance of ${constructor.name}`
            );
        }
    }

    static greaterThan(actual, expected, message = '') {
        if (actual <= expected) {
            throw new Error(
                message || `Expected ${actual} to be greater than ${expected}`
            );
        }
    }

    static lessThan(actual, expected, message = '') {
        if (actual >= expected) {
            throw new Error(
                message || `Expected ${actual} to be less than ${expected}`
            );
        }
    }

    static greaterThanOrEqual(actual, expected, message = '') {
        if (actual < expected) {
            throw new Error(
                message || `Expected ${actual} to be greater than or equal to ${expected}`
            );
        }
    }

    static lessThanOrEqual(actual, expected, message = '') {
        if (actual > expected) {
            throw new Error(
                message || `Expected ${actual} to be less than or equal to ${expected}`
            );
        }
    }

    static contains(array, value, message = '') {
        if (!Array.isArray(array)) {
            throw new Error('First argument must be an array');
        }
        if (!array.includes(value)) {
            throw new Error(
                message || `Expected array to contain ${value}`
            );
        }
    }

    static notContains(array, value, message = '') {
        if (!Array.isArray(array)) {
            throw new Error('First argument must be an array');
        }
        if (array.includes(value)) {
            throw new Error(
                message || `Expected array not to contain ${value}`
            );
        }
    }
}
