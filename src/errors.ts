import * as _ from 'lodash';

export class ErrorManager {
  /*
   * A generic error manager which is able to manage warning
   * and error messages for different application
   * domains throughout its lifecycle.
   *
   * It can be used to collect notification messages during
   * arbitrary processing steps in order to display them to
   * the user afterwards appropriately.
   *
   * A reasonable example would be to populate a tooltip
   * or another error notification box widget with the
   * corresponding information.
   */

  domains: Array<string> = [];
  storage: object = {};

  constructor() {
    // All unqualified error messages will go to the "default"
    // application domain, so let's register this right away.
    this.registerDomain('default');
  }

  registerDomain(name: string) {
    /*
     * Add another application domain for collecting error messages.
     */
    this.domains.push(name)
    this.reset(name);
  }

  registerDomains(...names: Array<string>) {
    /*
     * Add multiple application domains for collecting error messages.
     */
    names.forEach(this.registerDomain.bind(this));
  }

  add(message: string | object | Error, args: {level?: string, domain?: string}) {
    /*
     * Main method for adding an error item.
     */
    const level = args.level || 'error';
    const domain = args.domain || 'default';

    const item = this.makeItem(message, level);
    console.error(JSON.stringify(item));

    if (!this.storage[domain]) {
      throw new Error(`Error domain "${domain}" not registered`);
    }

    this.storage[domain].push(item);
  }

  reset(...domains: Array<string>) {
    const _this = this;
    domains.forEach(function (domain) {
      _this.storage[domain] = <Array<ErrorItem>>[];
    });
  }

  resetAll() {
    this.reset(...this.domains);
  }

  getAll() {
    /*
     * Get all error items for all application domains.
     */
    const _this = this;
    const errors: Array<ErrorItem> = [];
    this.domains.forEach(function(domain) {
      _this.storage[domain].forEach(function(error) {
        error.location = domain;
        errors.push(error);
      });
    });
    return errors;
  }

  getMessages() {
    /*
     * Get formatted error messages for all application domains.
     */
    const messages:Array<string> = [];
    this.getAll().forEach(function(item) {
      const suffix = item.name && item.name != 'Error' ? ` (${item.name})` : '';
      const message = `- ${item.message}${suffix}.`;
      messages.push(message);
    });
    return messages;
  }

  private makeItem(thing: any, level: string) {
    /*
     * Make up the representation of a single `ErrorItem`.
     */

    let errorItem = <ErrorItem>{};

    if (thing instanceof Error) {
      errorItem.status = 'error';
      errorItem.name = thing.name;
      errorItem.message = thing.message;

    } else if (typeof thing == 'string') {
      errorItem.name = 'Error';
      errorItem.message = thing;

    } else if (thing instanceof Object) {
      errorItem = thing;
    }

    // Fill some defaults.
    _.defaults(errorItem, {
      status: level,
      name: 'Error',
      message: 'Unknown',
    });

    return errorItem;
  }

}

interface ErrorItem {
  status: string;
  name: string;
  message: string;
  location: string;
}
