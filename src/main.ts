import * as core from '@actions/core';
import axios from 'axios';
import * as fs from 'fs';

interface CoreParams {
  openApiDefinitionFile: string;
  apiManagementEndpointUrl: string;
  credentials: string;
  apiUrlSuffix: string;
}

function getCoreParams(): CoreParams {
  const openApiDefinitionFile: string = core.getInput('openAPIDefinitions');

  if (!openApiDefinitionFile) {
    core.setFailed('Missing OpenAPI definition from input');
  }

  const apiManagementEndpointUrl: string = core.getInput('apiManagementApiUrl');

  if (!apiManagementEndpointUrl) {
    core.setFailed('Missing API Management API URL from input');
  }

  const credentials: string = core.getInput('credentials');

  if (!credentials) {
    core.setFailed('Missing credentials from input.');
  }

  const apiUrlSuffix: string = core.getInput('apiUrlSuffix');

  if (!apiUrlSuffix) {
    core.setFailed('Missing path from input.');
  }

  return {openApiDefinitionFile, apiManagementEndpointUrl, credentials, apiUrlSuffix};
}

async function run(): Promise<void> {
  try {
    const {openApiDefinitionFile, apiManagementEndpointUrl, credentials, apiUrlSuffix} = getCoreParams();

    // Request an access token
    core.info('Parse credentials JSON to an object');

    const jsonObj = JSON.parse(credentials);

    const config = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    core.info('Fetching access token');

    let response = null;

    const tokenRequestParams = {
      grant_type: 'client_credentials',
      client_id: jsonObj.clientId,
      client_secret: jsonObj.clientSecret,
      resource: 'https://management.azure.com/'
    };

    const requestArgs = new URLSearchParams(tokenRequestParams).toString();

    try {
      response = await axios.post(`https://login.microsoftonline.com/${jsonObj.tenantId}/oauth2/token`, requestArgs, config);
      core.info(response.data);
    } catch (err) {
      core.error(err);
    }

    let format = 'openapi+json-link';
    let value: string = openApiDefinitionFile;

    if (!openApiDefinitionFile.startsWith('http')) {
      // For local file paths we read the contents
      if (!fs.existsSync(openApiDefinitionFile)) {
        core.error(`Unable to locate definition file in path ${openApiDefinitionFile}`);
      }

      value = fs.readFileSync(openApiDefinitionFile, 'utf8');
      format = 'openapi+json';
    }

    const putData = {
      properties: {
        format,
        value,
        path: apiUrlSuffix
      }
    };

    //PUT get response to API manager
    const updated = await axios.put(apiManagementEndpointUrl, putData, {
      headers: {Authorization: `Bearer ${response?.data.access_token}`}
    });

    core.info(updated.data);
    core.info('Finished');
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
