const { flow, map } = require('lodash/fp');
const { MAX_PAGE_SIZE } = require('../constants');
const { requestsInParallel } = require('../request');

const searchIncidents = async (entities, options) =>
  flow(
    map((entity) => ({
      entity,
      method: 'POST',
      route: 'incidents/get_incidents',
      body: {
        request_data: {
          search_from: 0,
          search_to: MAX_PAGE_SIZE,
          filters: [
            {
              field: 'description', 
              value: entity.value,
              operator: 'contains'
            }
          ],
          sort: {
            field: 'creation_time',
            keyword: 'asc'
          }
        }
      },
      options
    })),
    async (incidentSearchRequests) =>
      await requestsInParallel(incidentSearchRequests, 'body.reply.incidents')
  )(entities);

module.exports = searchIncidents;
