# @brthlmy/serverless-netlify-form

Serverless netlify function to save forms in google sheets

## Prerequisite:

* Netlify functions
* 11ty + https://github.com/brthlmy-com/eleventy-plugin-form (coming soon)
* Google Service Account + Google Spreadsheet

## Setup:

In Netlfiy setup these environment variables:

* GOOGLE_SERVICE_ACCOUNT_EMAIL,
* GOOGLE_PRIVATE_KEY,
* SPREADSHEET_ID,
* SPREADSHEET_SHEET_TITLE,
* APEX_DOMAIN,

```bash
yarn add https://github.com/brthlmy-com/serverless-netlify-form.git
```
## Usage:

In your netlify deployed repository functions, eg: `<repo>/functions/form/index.js`

```javascript
const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  SPREADSHEET_ID,
  SPREADSHEET_SHEET_FORM_TITLE,
  APEX_DOMAIN,
} = process.env;

exports.handler = async (event, context) => {
  try {
    const {handler} = await import('@brthlmy/serverless-netlify-form');
    const result = await handler(event, {
      googleServiceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      googlePrivateKey: GOOGLE_PRIVATE_KEY,
      spreadsheetId: SPREADSHEET_ID,
      spreadsheetSheetTitle: SPREADSHEET_SHEET_FORM_TITLE,
      apexDomain: APEX_DOMAIN,
    });
    return result;
  } catch(e) {
    console.log('debug',e);
  }
};
```

## Tests:

```bash
yarn test
```
