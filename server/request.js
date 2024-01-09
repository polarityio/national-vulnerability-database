const {
  requests: { createRequestWithDefaults },
  logging: { getLogger }
} = require('polarity-integration-utils');

const { parallelLimit } = require('async');
const { map, get, getOr, filter, flow, negate, isEmpty } = require('lodash/fp');

const requestWithDefaults = createRequestWithDefaults({
  config: require('../config/config'),
  roundedSuccessStatusCodes: [200],
  useLimiter: true,
  requestOptionsToOmitFromLogsKeyPaths: [
    'headers.Authorization',
    'headers.x-xdr-auth-id'
  ],
  preprocessRequestOptions: ({ options, route, ...requestOptions }) => {
    return {
      ...requestOptions,
      url: `${options.url}/public_api/v1/${route}`,
      headers: {
        Authorization: options.apiKey,
        'x-xdr-auth-id': options.apiKeyId,
        'Content-Type': 'application/json'
      },
      json: true
    };
  },
  postprocessRequestFailure: (error) => {
    if (error.status === 302)
      error.message =
        'Your API Url is not working. Your API URL is not the same as your Cortex XDR ' +
        'instance URL, but can be found at Configuration -> API Key -> Copy API URL';
    if (error.status === 401)
      error.message =
        'Your API Key or API Key ID is not working. Your API Key and API Key ID can be found at Configuration -> API Key';

    throw error;
  }
});

const createRequestsInParallel =
  (requestWithDefaults) =>
  async (
    requestsOptions,
    responseGetPath,
    limit = 10,
    onlyReturnPopulatedResults = true
  ) => {
    const unexecutedRequestFunctions = map(
      ({ entity, ...requestOptions }) =>
        async () => {
          const response = await requestWithDefaults(requestOptions);
          const result = responseGetPath ? get(responseGetPath, response) : response;
          return entity ? { entity, result } : result;
        },
      requestsOptions
    );

    const results = await parallelLimit(unexecutedRequestFunctions, limit);

    return onlyReturnPopulatedResults
      ? filter(
          flow((result) => getOr(result, 'result', result), negate(isEmpty)),
          results
        )
      : results;
  };

const requestsInParallel = createRequestsInParallel(requestWithDefaults);

const NodeCache = require('node-cache');

const xqlQueryResultsCache = new NodeCache({ stdTTL: 3600 });

module.exports = {
  requestWithDefaults,
  requestsInParallel,
  xqlQueryResultsCache
};
