# Update Azure API Management OpenaAPI schema

This GitHub Action allows you to update your Azure API Management OpenAPI schema using a JSON definition file. Note that the definition file must be in JSON format. YAML is not supported by the API Management API (yeah, funny name)

## Inputs

`openAPIDefinitions`

A relative URL or inlined JSON contents for an OpenAPI schema definition.

#### Example value

```
http://petstore.swagger.io/v2/swagger.json
```

```
./openapi.json
```
---

`apiManagementApiUrl`

API Management API URL with subscriptionId, resourceGroup, serviceName etc.

#### Example value

```
 https://management.azure.com/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}?api-version=2021-08-01
```

> :warning:   **It is recommended that you store this in your Github secrets and reference that here. This URL has your subscription ID, resource names etc. and while that in itself is not too dangerous, it's never a good idea to expose more information than needed in your action workfiles.

To determine the API url of your API Management API, you can use the Azure CLI to list your API's and simply grab the `id` value of that response.

```
az apim api list --resource-group <RESOURCE-GROUP> --service-name <API-MANAGEMENT-SERVICE-NAME>
```

You can get both `RESOURCE-GROUP` and `API-MANAGEMENT-SERVICE-NAME` from your browser URL if you're at API Management in Azure portal.

This will return a list of objects, where each object contains an `id` property that looks something like this

    "id": "/subscriptions/{subscriptionID}/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}",
    
Now simply put that in between the domain (https://management.azure.com) and the api version query parameter (?api-version=2021-08-01) and good to go.
    
---

`credentials`

API Management credentials, pointing to a Github secret (in your repo). Expected to be in JSON format. 

```
${{ secrets.AZURE_APIM_CREDENTIALS }}
```

To get these, you need to go to your Azure Portal and find App Registrations. Create a new app, and add credentials to it. You need to copy the Client ID, Tenant ID and Secret Key from the application and credentials. Once you have those, create a new secret named `AZURE_APIM_CREDENTIALS` and add to it the following JSON:

```json
{
    "tenantId": "TENANT-ID>",
    "clientId": "<CLIENT-ID>",
    "secretKey": "<SECRET-KEY"
}
```

You may also need to allow some additional permissions for this new client. You can do this by following these steps:

1. Go to Subscriptions in your Azure portal (you can find this through the search)
2. Select your subscription from the list
3. Select Access Control (IAM) from the sidebar
4. Click + Add, from the top and select Add role assignment
5. Select Contributor, and click Next
6. Select User group or service principal, and search for your app using it's name
7. Click Select, and from the bottom Review + Assign

Your app should now have the necessary permissions to execute the schema update.

---

`path`

API URL suffix ie. `https://{apiId}.azure-api.net/{path}`

#### Example value

    public

It is not advisable to change this, as it will most likely break the API for the users.

---

## Example usage

```yaml
- name: Update Azure API Management OpenAPI schema
  uses: OssiPesonen/action-update-api-management-openapi@master
  with:
    openAPIDefinitions: http://petstore.swagger.io/v2/swagger.json
    apiManagementApiUrl: ${{ secrets.API_MANAGEMENT_API_URL }}
    credentials: ${{ secrets.AZURE_CREDENTIALS }}
```

## Resources

- [az apim api | Microsoft Docs](https://docs.microsoft.com/en-US/cli/azure/apim/api?view=azure-cli-latest#az-apim-api-list)
- [Apis - Create Or Update - REST API (Azure API Management](https://docs.microsoft.com/en-us/rest/api/apimanagement/current-ga/apis/create-or-update)
