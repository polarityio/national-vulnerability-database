const { flow, get, size, find, eq, map, some } = require('lodash/fp');

const assembleLookupResults = (entities, incidents, cachedXqlQueryResults, options) =>
  map((entity) => {
    const resultsForThisEntity = getResultsForThisEntity(
      entity,
      incidents,
      cachedXqlQueryResults,
      options
    );

    const resultsFound = some(
      (resultField) => size(resultField) || resultField === true,
      resultsForThisEntity
    );

    const lookupResult = {
      entity,
      data: resultsFound
        ? {
            summary: createSummaryTags(resultsForThisEntity, options),
            details: resultsForThisEntity
          }
        : null
    };

    return lookupResult;
  }, entities);

const getResultForThisEntity = (entity, results) =>
  flow(find(flow(get('entity.value'), eq(entity.value))), get('result'))(results);

const getResultsForThisEntity = (entity, incidents, cachedXqlQueryResults, options) => {
  const xqlQueryResults = getResultForThisEntity(entity, cachedXqlQueryResults);

  return {
    dashboardUrl: options.url.replace('api-', ''),
    doXqlQuery: options.doXqlQueries && !xqlQueryResults,
    incidents: getResultForThisEntity(entity, incidents),
    xqlQueryResults
  };
};

const createSummaryTags = ({ incidents, xqlQueryResults, doXqlQuery }, options) =>
  []
    .concat(size(incidents) ? `Incidents Found: ${size(incidents)}` : [])
    .concat(size(xqlQueryResults) ? `XQL Results: ${size(xqlQueryResults)}` : [])
    .concat(doXqlQuery ? 'Open to Run XQL Query' : []);

module.exports = assembleLookupResults;
