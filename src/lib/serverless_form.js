import qs from 'qs';
class ServerlessForm {
  netlifyHeaders;
  netlifyBody;
  domain;
  timestamp;
  netliftReferer;
  constructor({headers, body, httpMethod}, domain) {
    this.netlifyHeaders = headers;
    this.netlifyBody = body;
    this.netlifyHttpMethod = httpMethod;
    this.domain = `https://${domain.replace('www.', '')}/`;
    this.netlifyReferer = `${headers.referer.replace('www.', '')}`;
    this.qsService = qs;
  }
  static get teapotResponse() {
    return {
      statusCode: 418,
      body: JSON.stringify({status: "I'm a teapot"}),
    };
  }

  static get invalidMethodResponse() {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        status: 'invalid-method',
      }),
    };
  }

  get redirectSuccessUrl() {
    return `${this.domain}success.html`;
  }

  get redirectResponse() {
    return {
      statusCode: 302,
      headers: {
        Location: this.redirectSuccessUrl,
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({}),
    };
  }

  get isValidRequest() {
    return this.netlifyHttpMethod == 'POST' && this.netlifyBody;
  }

  get isValidDomain() {
    return this.domain == this.netlifyReferer;
  }

  get _parsedFormFields() {
    return this.qsService.parse(this.netlifyBody);
  }

  toString() {
    const {timestamp, formName, formData, country, locale} = this.sheetRow;

    const messageFieldsValues = Object.entries(JSON.parse(formData))
      .map(item => `<b>${item[0]}</b>: ${item[1]}`)
      .join('\n')
      .slice(0, 1000);

    return [
      `Date: ${timestamp}`,
      `Name: ${formName}`,
      `Origin: ${country} / ${locale}`,
      messageFieldsValues,
    ].join('\n');
  }

  get sheetRow() {
    this.timestamp = new Date().toISOString();

    const {'form-name': formName, ...restFormData} = this._parsedFormFields;

    const {
      'user-agent': ua,
      'x-language': locale,
      'x-country': country,
    } = this.netlifyHeaders;

    const row = {
      timestamp: this.timestamp,
      formName,
      formData: JSON.stringify(restFormData),
      country,
      locale,
      ua,
    };

    return row;
  }
}
export {ServerlessForm};
