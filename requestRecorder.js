/**
 * This util records request/responses in JSON files with a
 * directory structure similar to spec file directory. Also it intercept
 * responses and respond with the recorded fixtures when running on fixtures.
 *
 * import and call 'recordRequests();' in 'describe' block of the spec file to record requests.
 *
 * It is utilizing the Cypress's 'cy.intercept' API that intercepts the
 * requests in reverse order of initialization. Learn more on
 * intercept lifecycle: https://docs.cypress.io/api/commands/intercept#Interception-lifecycle
 */
/// <reference types="cypress" />

import path from 'path';
import {STUB_URL} from './constants';
import generateHashCode from './generateHashCode';
import kebabCase from './kebabCase';

const shouldRecord = Cypress.env('recordRequests');
const shouldUseLocalFixtures = Cypress.env('useLocalFixtures');
const routes = Cypress.env('requestUrls');
// URLs in blacklist are prevented from go to the server.
const blacklistedRoutes = Cypress.env('blacklistUrls');
const supportedMethods = ['GET', 'POST', 'PUT', 'DELETE'];

// Finding the fixture file path for the spec.
const specName = (Cypress.spec.relative).replace("cypress/e2e/", "");
const fixturesFolder = String(Cypress.config('fixturesFolder')).replace(/\\/g, '/');
let specFileName
let specFilePathFolder;
let specFolderName;
let localFixtureFolder;
let cdnFixtureFolder;

const recordRequests = function () {
    const routeRegex = RegExp(routes.map((route) => `(${route})`).join('|'));
    const cancelRouteRegex = RegExp(blacklistedRoutes.map((route) => `(${route})`).join('|'));

    // For getting current test details line test name, spec name etc..
    let currentTest = '';
    // For recording requests data to the routes specified. Cleared after each test.
    let requests = [];
    // For storing request alias to wait for requests
    let requestsAliases = [];

    Cypress.on('test:before:run', (testAttributes) => (currentTest = testAttributes));

    before(() => {
        specFileName = path.basename(specName);
        specFilePathFolder = `${specName.replace(`/${specFileName}`, '')}`
            .split('/')
            .map((e) => kebabCase(e))
            .join('/');
        specFolderName = path.basename(specName, path.extname(specName)).replace('.', '-');
        localFixtureFolder = path.join(
            fixturesFolder,
            Cypress.env('fixturesVersion'),
            specFilePathFolder,
            specFolderName
        );
        cdnFixtureFolder = path.join(specFilePathFolder, specFolderName);
    });

    beforeEach(() => {
        // Clear requests and aliases before each test
        requests = [];
        requestsAliases = [];

        /**
         * INTERCEPT - 1
         *
         * This is first registered intercept which intercepts all the requests that are not intercept in 2 and 3.
         * If not in record mode, it will destroy all the request that are trying to hit Yembo APIs(any 'routes')
         * In record mode, it will add all request/response to the 'requests' array.
         */
        cy.intercept(routeRegex, (req) => {
            if (!shouldRecord) {
                // If recording is OFF and a request is trying to hit 'routes' specified.
                console.log(
                    `%s %cCANCELLING %c${req.url}`,
                    '💥',
                    'color: red; font-weight: bold; background-color: yellow;',
                    'background-color: unset'
                );
                Cypress.log({
                    name: 'cancelRequest',
                    displayName: 'CANCEL REQUEST',
                    message: [`💥 Cancelling | ${req.url}`],
                });

                req.destroy();
                return;
            }

            const {url, method, body} = req;
            // Adding alias to the request to wait for all requests to complete.
            const hashCode = generateHashCode(`${method}${url}${JSON.stringify(body)}`);
            const alias = `${hashCode}${url.slice(-5)}`;
            req.alias = alias;
            requestsAliases.push(`@${alias}`);

            req.reply((res) => {
                const {statusCode, statusMessage} = res;
                const data = res?.body.constructor.name === 'Blob' ? res.body.text() : res.body;

                requests.push({url, method, body, statusCode, statusMessage, response: data});
            });
        });
        if (!shouldRecord) {
            const setupStub = (recordedRequests) => {
                cy.clock(recordedRequests.timestamp, ['Date']);

                // Group requests based methods and url
                const groupedRequests = {};
                supportedMethods.forEach((method) => (groupedRequests[method] = {}));

                recordedRequests?.requests.forEach((request) => {
                    if (!groupedRequests[request.method][request.url]) {
                        groupedRequests[request.method][request.url] = [];
                    }

                    groupedRequests[request.method][request.url].push(request);
                });

                const stubRequest = (method, url) => {
                    let index = 0;

                    /**
                     * INTERCEPT - 2
                     *
                     * This intercept will be added only if tests are running using fixtures.
                     * This will intercept all the request that are not matched to 'cancelRouteRegex'
                     * Intercepted requests will end its lifecycle here, since 'req.reply()' is called.
                     */
                    cy.intercept({method, url}, (req) => {
                        const {statusCode = 200, response} = groupedRequests[method][url][index];
                        req.reply(statusCode, response, {});

                        if (groupedRequests[method][url].length > index + 1) index++;
                    });
                };

                /**
                 * INTERCEPT - 4
                 *
                 * This will intercept all preflight requests and stub them
                 */
                if (!shouldRecord) {
                    cy.intercept(routeRegex, (req) => {
                        if (req.method === "OPTIONS") {
                            req.reply(204, {});
                        }
                    });
                }

                // Stub recorded requests
                Object.keys(groupedRequests).forEach((method) => {
                    Object.keys(groupedRequests[method]).forEach((url) => {
                        stubRequest(method, url);
                    });
                });
            };

            const fixtureFileName = `${kebabCase(currentTest["title"])}.json`;
            if (shouldUseLocalFixtures) {
                cy.readFile(path.join(localFixtureFolder, fixtureFileName)).then((data) => setupStub(data));
            } else {
                const cdnPath = path.join(cdnFixtureFolder, fixtureFileName);
                const fixturesVersion = Cypress.env('fixturesVersion') ? `/${Cypress.env('fixturesVersion')}` : '';
                cy.request(`${STUB_URL}${fixturesVersion}/${cdnPath}`).then(({body: data}) => setupStub(data));
            }
        }
        /**
         * INTERCEPT - 3
         *
         * This intercept will intercept the request at first, if the request matches to the 'cancelRouteRegex'.
         * Intercepted requests will be destroyed here, so it won't be intercepted by 1 and 2.
         */
        cy.intercept(cancelRouteRegex, (req) => req.destroy());
    });

    afterEach(() => {
        if (shouldRecord && Boolean(requests.length)) {
            cy.writeFile(path.join(localFixtureFolder, `${kebabCase(currentTest["title"])}.json`), {
                timestamp: Date.now(),
                requests: [...requests],
            });
        }
    });
};

export default recordRequests;
