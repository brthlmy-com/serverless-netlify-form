import {handler} from './index.js';
import {ServerlessForm} from './lib/serverless_form.js';
import {SpreadsheetHelper} from './lib/spreadsheet_helper.js';
import {GoogleSpreadsheet} from 'google-spreadsheet';
import {JWT} from 'google-auth-library';

jest.mock('google-auth-library');
jest.mock('google-spreadsheet');
// jest.mock('./lib/serverless_form');
jest.mock('./lib/spreadsheet_helper');
const fakeProcess = {
  env: {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: 'email',
    GOOGLE_PRIVATE_KEY: 'key',
    SPREADSHEET_ID: 'id',
    SPREADSHEET_SHEET_TITLE: 'title',
    APEX_DOMAIN: 'domain',
  },
};
const config = {
  googleServiceAccountEmail: fakeProcess.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  googlePrivateKey: fakeProcess.env.GOOGLE_PRIVATE_KEY,
  spreadsheetId: fakeProcess.env.SPREADSHEET_ID,
  spreadsheetSheetTitle: fakeProcess.env.SPREADSHEET_SHEET_TITLE,
  apexDomain: fakeProcess.env.APEX_DOMAIN,
};
const validNetlifyEvent = {
  headers: {
    referer: `https://${fakeProcess.env.APEX_DOMAIN}/`,
  },
  body: 'form-name=formName',
  httpMethod: 'POST',
};

describe('Serverless Netlify Form', () => {
  beforeEach(function() {
    Object.defineProperty(process, 'env', {
      value: {
        ...fakeProcess.env,
      },
    });
    jest.resetAllMocks();
  });

  test('no error', () => {
    expect(() => handler(validNetlifyEvent, config)).not.toThrow();
  });

  test('calls JWT with the process env variables', () => {
    handler(validNetlifyEvent, config);
    expect(JWT).toHaveBeenCalledWith({
      email: fakeProcess.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: fakeProcess.env.GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  });

  test('calls google-spreadsheet', () => {
    JWT.mockImplementation(() => {
      return {fake: 'jwt'};
    });
    handler(validNetlifyEvent, config);
    expect(GoogleSpreadsheet).toHaveBeenCalledWith(
      fakeProcess.env.SPREADSHEET_ID,
      {fake: 'jwt'},
    );
  });

  test.skip('calls ServerlessForm', async () => {
    SpreadsheetHelper.mockImplementation(() => {
      return {handle: () => Promise.resolve('google_service')};
    });
    // ServerlessForm.mockImplementation(() => {
    // return {fake: 'google_service'};
    // });

    const subject = jest.mock('./lib/serverless_form');
    await handler(validNetlifyEvent, config);
    expect(subject).toHaveBeenCalledWith(
      validNetlifyEvent,
      process.env.APEX_DOMAIN,
    );
  });

  test('calls spreadsheetHelper', () => {
    GoogleSpreadsheet.mockImplementation(() => {
      return {fake: 'google_service'};
    });
    handler(validNetlifyEvent, config);
    expect(SpreadsheetHelper).toHaveBeenCalledWith(
      {fake: 'google_service'},
      process.env.SPREADSHEET_SHEET_TITLE,
    );
  });

  describe('returns the correct response headers', () => {
    test('is a valid request with post method and correct body', async () => {
      SpreadsheetHelper.mockImplementation(() => {
        return {handle: () => Promise.resolve('google_service')};
      });
      const subject = await handler(validNetlifyEvent, config);
      expect(subject.redirectResponse).toEqual({
        statusCode: 302,
        headers: {
          Location: 'https://domain/success.html',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({}),
      });
    });

    test('is a valid request with post method and correct body, has message', async () => {
      SpreadsheetHelper.mockImplementation(() => {
        return {handle: () => Promise.resolve('google_service')};
      });
      const subject = await handler(validNetlifyEvent, config);
      expect(subject.message).toBeDefined();
    });

    test('invalid request with post method and empty body', async () => {
      const subject = await handler(
        {...validNetlifyEvent, body: '', httpMethod: ''},
        config,
      );
      expect(subject.redirectResponse).toEqual({
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          status: 'invalid-method',
        }),
      });
      expect(subject.message).not.toBeDefined();
    });

    ['GET', 'PUT', 'DELETE'].forEach(requestMethod => {
      test(`invalid request with ${requestMethod} method and correct body`, async () => {
        const subject = await handler(
          {...validNetlifyEvent, httpMethod: requestMethod},
          config,
        );
        expect(subject.redirectResponse).toEqual({
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
          body: JSON.stringify({
            status: 'invalid-method',
          }),
        });
      expect(subject.message).not.toBeDefined();
      });
    });

    test('teapotResponse, with none matching domains in netlify event headers', async () => {
      const subject = await handler(
        {...validNetlifyEvent, headers: {referer: 'invalid.com'}},
        config,
      );
      expect(subject.redirectResponse).toEqual({
        body: '{"status":"I\'m a teapot"}',
        statusCode: 418,
      });
      expect(subject.message).not.toBeDefined();
    });
  });
});
