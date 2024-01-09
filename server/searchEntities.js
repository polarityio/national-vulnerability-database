const { searchIncidents, getCachedEntityResults } = require('./queries');

const searchEntities = async (entities, options) => {
  const cachedXqlQueryResults = getCachedEntityResults(entities, options);
  const incidents = await searchIncidents(entities, options);

  return { incidents, cachedXqlQueryResults };
};

module.exports = searchEntities;
