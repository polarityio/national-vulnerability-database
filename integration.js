'use strict';
const { get, getOr } = require('lodash/fp');
const {
  logging: { setLogger, getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { buildIgnoreResults, organizeEntities } = require('./server/dataTransformations');

const { validateOptions } = require('./server/userOptions');
const searchEntities = require('./server/searchEntities');
const assembleLookupResults = require('./server/assembleLookupResults');

const { searchXqlQuery } = require('./server/queries');
const onMessageFunctions = require('./server/onMessage');

const doLookup = async (entities, _options, cb) => {
  const Logger = getLogger();
  try {
    Logger.debug({ entities }, 'Entities');

    const options = {
      ..._options,
      maxConcurrent: 1,
      minimumMillisecondsRequestWillTake: 110
    };

    const { searchableEntities, nonSearchableEntities } = organizeEntities(entities);

    const { incidents, cachedXqlQueryResults } = await searchEntities(
      searchableEntities,
      options
    );

    Logger.trace({ incidents, cachedXqlQueryResults });

    const lookupResults = assembleLookupResults(
      entities,
      incidents,
      cachedXqlQueryResults,
      options
    );

    const ignoreResults = buildIgnoreResults(nonSearchableEntities);

    Logger.trace({ lookupResults, ignoreResults }, 'Lookup Results');

    cb(null, lookupResults.concat(ignoreResults));
  } catch (error) {
    const err = parseErrorToReadableJson(error);

    Logger.error({ error, formattedError: err }, 'Get Lookup Results Failed');
    cb({ detail: error.message || 'Lookup Failed', err });
  }
};

const onDetails = async (lookupObject, options, cb) => {
  try {
    const xqlQueryJobId =
      get('data.details.doXqlQuery', lookupObject) &&
      (await searchXqlQuery(lookupObject.entity, options));

    cb(null, {
      ...lookupObject.data,
      details: { ...lookupObject.data.details, xqlQueryJobId }
    });
  } catch (error) {
    getLogger().trace({ error }, 'Failed to Get Details');

    cb(null, {
      ...lookupObject.data,
      details: {
        ...lookupObject.data.details,
        queryFailed: true,
        searchXqlQueryErrorMessage:
          'Cortex XDR is running the maximum number of allowed XQL queries.  Please try to Run the XQL Query again in a few seconds.'
      }
    });
  }
};

const onMessage = ({ action, data: actionParams }, options, callback) =>
  onMessageFunctions[action](actionParams, options, callback);

module.exports = {
  startup: setLogger,
  validateOptions,
  doLookup,
  onDetails,
  onMessage
};
