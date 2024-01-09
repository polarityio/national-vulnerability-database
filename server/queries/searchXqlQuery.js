const { replace, get } = require('lodash/fp');
const { requestWithDefaults } = require('../request');
const {
  logging: { getLogger }
} = require('polarity-integration-utils');

const escapeQuotes = replace(/(\r\n|\n|\r)/gm, '');

const searchXqlQuery = async (entity, options) => {
  const xqlQueryJobId = get(
    'body.reply',
    await requestWithDefaults({
      entity,
      method: 'POST',
      route: 'xql/start_xql_query',
      body: {
        request_data: {
          query: replace(
            /{{ENTITY}}/gi,
            escapeQuotes(entity.value),
            options.xqlQueryString
          )
        }
      },
      options
    })
  );

  getLogger().trace({ xqlQueryJobId }, 'XQL Query Job Id');
  return xqlQueryJobId;
};

module.exports = searchXqlQuery;
