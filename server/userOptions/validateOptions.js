const { validateStringOptions } = require('./utils');
const {
  userOptions: { validateUrlOption }
} = require('polarity-integration-utils');

const validateOptions = async (options, callback) => {
  const stringOptionsErrorMessages = {
    url: '* Required',
    apiKey: '* Required',
    apiKeyId: '* Required'
  };

  const stringValidationErrors = validateStringOptions(
    stringOptionsErrorMessages,
    options
  );

  const urlValidationError = validateUrlOption(options);

  const xqlQueryStringError =
    options.xqlQueryString.value &&
    !options.xqlQueryString.value.toLowerCase().includes('{{entity}}')
      ? {
          key: xqlQueryString,
          message:
            'XQL Query String must include {{ENTITY}} so we can search specific entities and not get the same result for every search.'
        }
      : [];

  const errors = stringValidationErrors
    .concat(urlValidationError)
    .concat(xqlQueryStringError);

  callback(null, errors);
};

module.exports = validateOptions;
