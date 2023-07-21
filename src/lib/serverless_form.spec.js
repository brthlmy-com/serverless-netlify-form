import {ServerlessForm} from './serverless_form.js';
import qs from 'qs';

jest.mock('qs');
describe('Serverless Form', () => {
  const domain = 'example.com';
  const netlifyHeaders = {
    headers: {
      referer: 'https://example.com/',
      'user-agent': 'browserUserAgent',
      'x-language': 'en_GB',
      'x-country': 'DE',
    },
    body: 'form-name=nameOfForm&someField=someValue&tos=agreed',
  };

  const expectedParsedBodyValues = {
    'form-name': 'nameOfForm',
    someField: 'someValue',
    tos: 'agreed',
  };

  const expectedSheetRow = {
    timestamp: 'timestamp',
    formName: 'nameOfForm',
    formData: JSON.stringify({
      someField: 'someValue',
      tos: 'agreed',
    }),
    country: 'DE',
    locale: 'en_GB',
    ua: 'browserUserAgent',
  };

  const config = {
    redirectSuccessUrl: `https://${domain}/success.html`,
  };

  beforeEach(function() {
    jest.resetAllMocks();
  });

  test('no error', () => {
    expect(() => new ServerlessForm(netlifyHeaders, domain)).not.toThrow();
  });

  test('has .netlifyHeaders', () => {
    const subject = new ServerlessForm(netlifyHeaders, domain);
    expect(subject.netlifyHeaders).toBeDefined();
    expect(subject.netlifyHeaders).toEqual(netlifyHeaders.headers);
  });

  test('has .netlifyBody', () => {
    const subject = new ServerlessForm(netlifyHeaders, domain);
    expect(subject.netlifyBody).toBeDefined();
    expect(subject.netlifyBody).toEqual(netlifyHeaders.body);
  });

  test('has .netlifyReferer removes www.', () => {
    const subject = new ServerlessForm(
      {headers: {referer: 'https://www.example.com/'}},
      domain,
    );
    expect(subject.netlifyReferer).toEqual(`${netlifyHeaders.headers.referer}`);
  });

  test('has .domain', () => {
    const subject = new ServerlessForm(netlifyHeaders, domain);
    expect(subject.domain).toBeDefined();
    expect(subject.domain).toEqual(`https://${domain}/`);
  });

  test('has .domain removes wwww.', () => {
    const subject = new ServerlessForm(netlifyHeaders, `www.${domain}`);
    expect(subject.domain).toBeDefined();
    expect(subject.domain).toEqual(`https://${domain}/`);
  });

  test('has .redirectSuccessUrl', () => {
    const subject = new ServerlessForm(netlifyHeaders, domain);
    expect(subject.redirectSuccessUrl).toBeDefined();
    expect(subject.redirectSuccessUrl).toEqual(
      `https://${domain}/success.html`,
    );
  });

  describe('static', () => {
    test('.teapotResponse', () => {
      expect(ServerlessForm.teapotResponse).toBeDefined();
      expect(ServerlessForm.teapotResponse.statusCode).toEqual(418);
      expect(ServerlessForm.teapotResponse.body).toBeDefined();
    });

    test('.invalidMethodResponse', () => {
      expect(ServerlessForm.invalidMethodResponse).toBeDefined();
      expect(ServerlessForm.invalidMethodResponse.headers).toBeDefined();
      expect(ServerlessForm.invalidMethodResponse.statusCode).toEqual(400);
      expect(ServerlessForm.invalidMethodResponse.body).toBeDefined();
    });
  });

  describe('getter', () => {
    test('.redirectResponse', () => {
      const subject = new ServerlessForm(netlifyHeaders, domain, config);
      expect(subject.redirectResponse).toBeDefined();
      expect(subject.redirectResponse.statusCode).toEqual(302);
      expect(subject.redirectResponse.headers['Location']).toEqual(
        `https://${domain}/success.html`,
      );
    });
  });

  describe('.isValidRequest', () => {
    test('with httpMethod POST and body', () => {
      const subject = new ServerlessForm(
        {...netlifyHeaders, httpMethod: 'POST'},
        domain,
      );
      expect(subject.isValidRequest).toBeTruthy();
    });

    ['GET', 'PUT', 'DELETE'].forEach(requestMethod =>
      test(`with httpMethod ${requestMethod} and body`, () => {
        const subject = new ServerlessForm(
          {...netlifyHeaders, httpMethod: requestMethod},
          'tld.com',
        );
        expect(subject.isValidRequest).toBeFalsy();
      }),
    );

    ['POST', 'GET', 'PUT', 'DELETE'].forEach(requestMethod =>
      test(`with httpMethod ${requestMethod} and missing body`, () => {
        const subject = new ServerlessForm(
          {...netlifyHeaders, httpMethod: requestMethod, body: ''},
          'tld.com',
        );
        expect(subject.isValidRequest).toBeFalsy();
      }),
    );
  });

  describe('.isValidDomain', () => {
    test('with matching domain', () => {
      const subject = new ServerlessForm(netlifyHeaders, domain);
      expect(subject.isValidDomain).toBeTruthy();
    });

    test('without matching domain', () => {
      const subject = new ServerlessForm(netlifyHeaders, 'tld.com');
      expect(subject.isValidDomain).toBeFalsy();
    });
  });

  describe('.sheetRow', () => {
    test('creates timestamp', () => {
      const mock = jest.fn();
      qs.parse = mock.mockReturnValue(expectedParsedBodyValues);
      const expectedDate = 'timestamp';
      const mockToISOString = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockImplementation(() => expectedDate);
      const subject = new ServerlessForm(netlifyHeaders, domain);
      subject.sheetRow;
      expect(mockToISOString).toHaveBeenCalled();
      expect(subject.timestamp).toEqual(expectedDate);
    });

    test('extracts body with qs lib, has form-name in body', () => {
      const mock = jest.fn();
      qs.parse = mock.mockReturnValue(expectedParsedBodyValues);
      const subject = new ServerlessForm(netlifyHeaders, domain);
      subject.sheetRow;
      expect(mock).toHaveBeenCalledWith(netlifyHeaders.body);
    });

    test('creates expected sheet row', () => {
      const mockToISOString = jest
        .spyOn(Date.prototype, 'toISOString')
        .mockImplementation(() => 'timestamp');
      const mock = jest.fn();
      qs.parse = mock.mockReturnValue(expectedParsedBodyValues);
      const subject = new ServerlessForm(netlifyHeaders, domain);
      subject.sheetRow;
      expect(subject.sheetRow).toMatchObject(expectedSheetRow);
    });
  });
});
