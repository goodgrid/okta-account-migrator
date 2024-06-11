
# Okta Account Migrator

## Introduction

Okta Account Migrator is a helper tool to migrate accounts from one Okta instance to another. It reads batches of 
accounts from the source Okta to create them in the target Okta. The size of the batches is configurable. The results are 
- The accounts within the batch being created in the target Okta configured to trigger the Import Password Inline Hook as soon as the users attempt to log in, and
- A CSV file with the properties of the batch of migrated accounts to include in the communication campaign.

The new account at the target Okta is configured to import the password from the source Okta via the 'Import Password Inline Hook'. This requires the target Okta to have been setup with this hook via _Workflows => Inline Hooks => Add Inline Hook => Import Password_. The account status will trigger calling this hook. The hook is configured to call the Okta Account Migrator server with the credentials entered by the user. Okta Account Migrator attempts to authenticate with these credentials at the source Okta. If this succeeds, then the succesful response is sent to the target Okta, which will let the user in and store the password. If authentication at the Okta source fails, the user will not be able to enter the target Okta until authentication at the source succeeds.

After logging in to the target Okta, the user will be required to set up any other required authenticators as the account is newly created and second factors at the source Okta have not been migrated.

## Overview

The below diagram aimes to depict that credentials entered by a newly migrated user are checked against the source Okta. If authentication succeeeds, the password is stored in the target Okta, and the user is granted access. The next time the user logs in, the password will be checked against the target Okta.

![alt text](overview.png "Title")




## Open issues

_Issues_

- What about second factors?

_To Do_

- Implement HTTPS/TLS in Express
- Implement actual moving of accounts via batches and creation of CSV
- Implement Helmet for web server hardening 


## References

- https://developer.okta.com/docs/reference/password-hook/
- https://developer.okta.com/docs/guides/password-import-inline-hook/nodejs/main/
- https://www.okta.com/sites/default/files/2021-02/WPR_Okta-User-Migration-Guide.pdf
