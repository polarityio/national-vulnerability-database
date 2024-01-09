const { flow, map, filter, size, isArray } = require('lodash/fp');
const { xqlQueryResultsCache } = require('../request');

const getCachedEntityResults = async (entities, options) =>
  flow(
    map((entity) => ({
      entity,
      result: xqlQueryResultsCache.get(entity.value + options.xqlQueryString)
    })),
    filter(({ result }) => result !== undefined)
  )(entities);

module.exports = getCachedEntityResults;
