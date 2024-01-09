const {
  logging: { getLogger },
  errors: { parseErrorToReadableJson }
} = require('polarity-integration-utils');

const { searchXqlQuery } = require('../queries');

const reSearchXqlQuery = async ({ entity }, options, callback) => {
  const Logger = getLogger();
  try {
    const xqlQueryJobId = await searchXqlQuery(entity, options);

    Logger.trace({ entity, xqlQueryJobId }, 'Query Lookup Successful');

    callback(null, { xqlQueryJobId });
  } catch (error) {
    const err = parseErrorToReadableJson(error);
    Logger.error(
      {
        detail: 'Failed Query Lookup',
        entity,
        formattedError: err
      },
      'Query Lookup Failed'
    );
    return callback({
      errors: [
        {
          err: error,
          detail:
            'Cortex XDR is running the maximum number of allowed XQL queries. Please try to Run the XQL Query again in a few seconds..'
        }
      ]
    });
  }
};

module.exports = reSearchXqlQuery;
