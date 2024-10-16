/// <reference types="cypress" />
// @ts-check

/**
 * Get the options object for `cy.request` with headers added.
 * @param {string} method
 * @param {string} endpoint
 * @param {Object} [body]
 * @returns {Partial<Cypress.RequestOptions>}
 */
const getRequestOptions = (method, endpoint, body = null) => {
  return {
    method,
    url: `${Cypress.env('apiUrl')}/${endpoint}`,
    body,
    failOnStatusCode: false,
    headers: {
      'X-Employee-Access-Token': localStorage.getItem('accessToken'),
      'Content-Type': 'application/json',
    },
  };
};

export default getRequestOptions;
