
# Okta Account Migrator

## Introduction

Okta Account Migrator is a helper tool to migrate accounts from one Okta instance to another. It reads batches of 
accounts from the source Okta to create them in the target Okta. The size of the batches is configurable. The result is 
- the accounts being created in the target Okta with their password credential set to the password inline hook.
- A CSV file with the properties of the batch of migrated accounts to include in the communication campaign.

The new account at the target Okta is configured to import the password from the source Okta via the 'Import Password Inline Hook'. This requires the target Okta to have been setup with this hook via _Workflows => Inline Hooks => Add Inline Hook => Import Password_. The account status will trigger calling this hook. The hook is configured to call the Okta Account Migrator server with the credentials entered by the user. Okta Account Migrator attempts to authenticate with these credentials at the source Okta. If this succeeds, then the succesful response is sent to the target Okta, which will let the user in and store the password. If authentication at the Okta source fails, the user will not be able to enter the target Okta until authentication at the source succeeds.

After logging in to the target Okta, the user will be required to set up any other required authenticators as the account is newly created and second factors at the source Okta have not been migrated.





## Issues and To do items

_Issues_

- What about second factors?

_To Do_

- Implement actual moving of accounts via batches and creation of CSV
- Implement Helmet for web server hardening 





Development 
https://developer.okta.com/docs/reference/password-hook/
https://developer.okta.com/docs/guides/password-import-inline-hook/nodejs/main/

Deployment
https://learn.microsoft.com/en-us/azure/container-instances/container-instances-quickstart