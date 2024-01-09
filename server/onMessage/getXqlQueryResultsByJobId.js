const { get } = require('lodash/fp');

const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { requestWithDefaults, xqlQueryResultsCache } = require('../request');

const getXqlQueryResultsByJobId = async ({ entity, jobId }, options, callback) => {
  const Logger = getLogger();
  try {
    if (!jobId) {
      throw new Error(
        "Query couldn't run. Try Re-Searching this entity in a few seconds."
      );
    }

    const cachedXqlQueryResults = xqlQueryResultsCache.get(
      entity.value + options.xqlQueryString
    );
    if (cachedXqlQueryResults)
      return callback(null, { xqlQueryResults: cachedXqlQueryResults });

    let xqlQueryReply = get(
      'body.reply',
      await requestWithDefaults({
        method: 'POST',
        route: 'xql/get_query_results',
        body: {
          request_data: {
            query_id: jobId
          }
        },
        options
      })
    );

    if (get('status', xqlQueryReply) === 'PENDING') {
      return callback(null, { stillPending: true });
    }

    const xqlQueryResults = get('results.data', xqlQueryReply);

    Logger.trace({ xqlQueryReply, xqlQueryResults }, 'Query Job ID Lookup Successful');

    xqlQueryResultsCache.set(entity.value + options.xqlQueryString, xqlQueryResults);

    callback(null, { xqlQueryResults });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Query Job ID Lookup',
        entity,
        jobId,
        formattedError: err
      },
      'Query Job ID Lookup Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail: error.message || 'Query Job ID Lookup Failed'
        }
      ]
    });
  }
};

module.exports = getXqlQueryResultsByJobId;
