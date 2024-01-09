polarity.export = PolarityComponent.extend({
  details: Ember.computed.alias('block.data.details'),
  summary: Ember.computed.alias('block.data.summary'),
  activeTab: 'incidents',
  timezone: Ember.computed('Intl', function () {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }),
  expandableTitleStates: Ember.computed.alias('block._state.expandableTitleStates'),
  xqlResultsObtained: false,
  getXqlQueryResultsIsRunning: false,
  getXqlQueryResultsSuccessMessage: '',
  xqlQueryDisplayString: '',
  searchXqlQueryIsRunning: false,
  searchXqlQueryErrorMessage: Ember.computed(
    'details.searchXqlQueryErrorMessage',
    function () {
      if(this.get('details.searchXqlQueryErrorMessage')) {
        setTimeout(() => {
          if (!this.isDestroyed) {
            this.set('details.searchXqlQueryErrorMessage', '');

            this.get('block').notifyPropertyChange('data');
          }
        }, 10000);
      }
      return this.get('details.searchXqlQueryErrorMessage');
    }
  ),
  queryFailed: false,
  init: function () {
    // Admin might have locked this setting in which case non-admin users
    // won't have it set
    if (this.get('block.userOptions.xqlQueryString')) {
      this.set(
        'xqlQueryDisplayString',
        this.get('block.userOptions.xqlQueryString').replace(
          /{{ENTITY}}/gi,
          this.get('block.entity.value')
        )
      );
    }

    if (this.get('details.xqlQueryResults')) this.set('xqlResultsObtained', true);

    if (!this.get('block._state')) {
      this.set('block._state', {});
      this.set('block._state.expandableTitleStates', {});
    }
    if ((this.get('details.incidents') || []).length) {
      this.set('activeTab', 'incidents');
    } else {
      this.set('activeTab', 'xqlQueryResult');
    }

    this._super(...arguments);
  },
  actions: {
    changeTab: function (tabName) {
      this.set('activeTab', tabName);
      if (!this.get('xqlResultsObtained') && tabName === 'xqlQueryResult')
        this.getXqlQueryResults();
    },
    toggleExpandableTitle: function (index) {
      this.set(
        `block._state.expandableTitleStates.${index}`,
        !this.get(`block._state.expandableTitleStates.${index}`)
      );
    },
    getXqlQueryResults: function () {
      this.getXqlQueryResults();
    },
    searchXqlQuery: function () {
      this.searchXqlQuery();
    }
  },
  getXqlQueryResults: function () {
    this.set('getXqlQueryResultsIsRunning', true);
    this.set('getXqlQueryResultsSuccessMessage', '');

    this.sendIntegrationMessage({
      action: 'getXqlQueryResults',
      data: {
        entity: this.get('block.entity'),
        jobId: this.get('details.xqlQueryJobId')
      }
    })
      .then(({ stillPending, xqlQueryResults }) => {
        if (stillPending) {
          this.set('getXqlQueryResultsSuccessMessage', 'XQL Query is still running...');

          return;
        }

        this.set(`details.xqlQueryResults`, xqlQueryResults);
        this.set(
          'summary',
          this.get('summary')
            .filter((summaryTag) => summaryTag !== 'Open to Run XQL Query')
            .concat(`XQL Results: ${xqlQueryResults.length}`)
        );
        this.set('xqlResultsObtained', true);
      })
      .catch((err) => {
        this.set(
          `details.getXqlQueryResultsErrorMessage`,
          (err &&
            (err.detail || err.message || err.err || err.title || err.description)) ||
            'Unknown Reason'
        );
        this.set('details.queryFailed', true);
      })
      .finally(() => {
        this.set('getXqlQueryResultsIsRunning', false);
        this.get('block').notifyPropertyChange('data');

        setTimeout(() => {
          if (!this.isDestroyed) {
            this.set('getXqlQueryResultsSuccessMessage', '');

            this.get('block').notifyPropertyChange('data');
          }
        }, 10000);
      });
  },
  searchXqlQuery: function () {
    this.set('searchXqlQueryIsRunning', true);

    this.sendIntegrationMessage({
      action: 'searchXqlQuery',
      data: {
        entity: this.get('block.entity')
      }
    })
      .then(({ xqlQueryJobId }) => {
        this.set('details.queryFailed', false);

        this.set('details.xqlQueryJobId', xqlQueryJobId);
      })
      .catch((err) => {
        this.set(
          `searchXqlQueryErrorMessage`,
          (err &&
            (err.detail || err.message || err.err || err.title || err.description)) ||
            'Unknown Reason'
        );
        this.set('details.queryFailed', true);
      })
      .finally(() => {
        this.set('searchXqlQueryIsRunning', false);
        this.get('block').notifyPropertyChange('data');

        setTimeout(() => {
          if (!this.isDestroyed) {
            this.set('searchXqlQueryErrorMessage', '');

            this.get('block').notifyPropertyChange('data');
          }
        }, 10000);
      });
  }
});
