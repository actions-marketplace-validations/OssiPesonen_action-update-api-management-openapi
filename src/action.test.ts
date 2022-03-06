import * as core from '@actions/core';
import axios from 'axios';
import { action, API_VERSION } from './action';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Test action', () => {
  beforeEach(() => {
    jest.restoreAllMocks();

    // Silence the stdout for logging
    jest.spyOn(core, 'info').mockImplementation(() => true);

    jest.spyOn(core, 'setFailed').mockImplementation(() => {
      // Instead of just stdout error, stop the code
      throw new Error();
    });
  });

  it('Should fail on missing openApiDefinition input', async () => {
    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Missing OpenAPI definition from input');
  });

  it('Should fail on missing apiId', async () => {
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Missing API ID from input');
  });

  it('Should fail on missing credentials', async () => {
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';
    process.env['INPUT_APIID'] = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Missing credentials from input');
  });

  it('Should fail on missing path', async () => {
    // Set up some dummy input
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';
    process.env['INPUT_APIID'] = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';
    process.env['INPUT_CREDENTIALS'] = '{}';

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Missing path from input');
  });

  it('Should fail on invalid JSON for definitions', async () => {
    // Set up some dummy input
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';
    process.env['INPUT_APIID'] = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';
    process.env['INPUT_CREDENTIALS'] = 'failure';
    process.env['INPUT_APIURLSUFFIX'] = 'public';

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(core.setFailed).toHaveBeenNthCalledWith(1, 'Unexpected token i in JSON at position 2');
  });

  it('Should fail on unauthorized response', async () => {
    // Set up some dummy input
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';
    process.env['INPUT_APIID'] = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';
    process.env['INPUT_CREDENTIALS'] = '{ "clientId": "abc", "tenantId": "def", "clientSecret": "secret" }';
    process.env['INPUT_APIURLSUFFIX'] = 'public';

    // Silence stdout and dont throw error here a second time
    jest.spyOn(core, 'setFailed').mockImplementation(() => true);

    jest.spyOn(core, 'error').mockImplementation(() => {
      throw new Error();
    });

    mockedAxios.post.mockRejectedValue({
      data: {
        errors: {
          message: 'Invalid credentials'
        }
      }
    });

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(axios.post).toHaveBeenCalledWith(
      `https://login.microsoftonline.com/def/oauth2/token`,
      'grant_type=client_credentials&client_id=abc&client_secret=secret&resource=https%3A%2F%2Fmanagement.azure.com%2F',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
  });

  it('Should fail on missing JSON file at local path', async () => {
    // Set up some dummy input
    const apiIdPath = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';
    process.env['INPUT_OPENAPIDEFINITIONS'] = './openapi.json';
    process.env['INPUT_APIID'] = apiIdPath;
    process.env['INPUT_CREDENTIALS'] = '{ "clientId": "abc", "tenantId": "def", "clientSecret": "secret" }';
    process.env['INPUT_APIURLSUFFIX'] = 'public';

    // Silence stdout for failure
    jest.spyOn(core, 'setFailed').mockImplementation(() => true);

    jest.spyOn(core, 'error').mockImplementation(() => {
      // Instead of just stdout error, stop the code here because JSON fails on error
      throw new Error();
    });

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'abc'
      }
    });

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(axios.post).toHaveBeenCalledWith(
      `https://login.microsoftonline.com/def/oauth2/token`,
      'grant_type=client_credentials&client_id=abc&client_secret=secret&resource=https%3A%2F%2Fmanagement.azure.com%2F',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    expect(core.error).toHaveBeenCalledWith(`Unable to locate definition file in path ./openapi.json`);
  });

  it('Should execute a successful API update', async () => {
    // Set up some dummy input
    const apiIdPath = '/subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi';
    process.env['INPUT_OPENAPIDEFINITIONS'] = 'http://petstore.swagger.io/v2/swagger.json';
    process.env['INPUT_APIID'] = apiIdPath;
    process.env['INPUT_CREDENTIALS'] = '{ "clientId": "abc", "tenantId": "def", "clientSecret": "secret" }';
    process.env['INPUT_APIURLSUFFIX'] = 'public';

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: 'abc'
      }
    });

    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true
      }
    });

    try {
      await action();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }

    expect(axios.post).toHaveBeenCalledWith(
      `https://login.microsoftonline.com/def/oauth2/token`,
      'grant_type=client_credentials&client_id=abc&client_secret=secret&resource=https%3A%2F%2Fmanagement.azure.com%2F',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    expect(axios.put).toHaveBeenCalledWith(
      `https://management.azure.com${apiIdPath}?api-version=${API_VERSION}`,
      {
        properties: {
          format: 'openapi+json-link',
          path: 'public',
          value: 'http://petstore.swagger.io/v2/swagger.json'
        }
      },
      { headers: { Authorization: 'Bearer abc' } }
    );
  });
});
