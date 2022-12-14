# Update Azure API Management OpenaAPI schema

This GitHub Action allows you to update your Azure API Management OpenAPI schema using a JSON definition file. Note that the definition file must be in JSON format. YAML is not supported by the API Management API (yeah, funny name)

# Example usage

Add the following to your workflow steps.

```yaml
- name: Update Azure API Management OpenAPI schema
  uses: OssiPesonen/action-update-api-management-openapi@master
  with:
    openAPIDefinitions: http://petstore.swagger.io/v2/swagger.json
    apiId: /subscriptions/abc123/resourceGroups/myResources/providers/Microsoft.ApiManagement/service/superbApi/apis/excellentApi
    apiUrlSuffix: public
    credentials: ${{ secrets.AZURE_CREDENTIALS }}
```

# Inputs

`openAPIDefinitions`

A relative URL or inlined JSON contents for an OpenAPI schema definition.

#### Example value

```
http://petstore.swagger.io/v2/swagger.json
```

The following can be used in Github Actions if your file is located at your repo root.

```
./openapi.json
```
---

`apiId`

API Management API ID with subscriptionId, resourceGroup, serviceName etc.

#### Example value

```
/subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}
```

To find out your API ID, you can use the Azure CLI to list your API's and simply grab the `id` value of that response.

```
az apim api list --resource-group <RESOURCE-GROUP> --service-name <API-MANAGEMENT-SERVICE-NAME>
```
This will return a list of objects, where each object contains an `id` property that looks something like this

    "id": "/subscriptions/{subscriptionID}/resourceGroups/{resourceGroup}/providers/Microsoft.ApiManagement/service/{serviceName}/apis/{apiId}",

*If needed, you can get both `RESOURCE-GROUP` and `API-MANAGEMENT-SERVICE-NAME` from your browser URL if you're at API Management in Azure portal.*

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
    "clientSecret": "<SECRET-KEY"
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

`apiUrlSuffix`

API URL suffix ie. `https://{apiId}.azure-api.net/{apiUrlSuffix}`

#### Example value

    public

It is not advisable to change this, as it will most likely break the API for the users.

# Resources

- [az apim api | Microsoft Docs](https://docs.microsoft.com/en-US/cli/azure/apim/api?view=azure-cli-latest#az-apim-api-list)
- [Apis - Create Or Update - REST API (Azure API Management](https://docs.microsoft.com/en-us/rest/api/apimanagement/current-ga/apis/create-or-update)
