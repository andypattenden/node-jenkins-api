/* eslint-env node, es6 */

var protocolAdapters = {
  http: require("http"),
  https: require("https")
};

class Jenkins {
  constructor(options) {
    this.protocol = options.protocol || "http";
    this.hostname = options.hostname;
    this.username = options.username;
    this.apiToken = options.apiToken;
    this.headers = {};

    if (options.username && options.apiToken) {
      options.basicAuthEncodedString = Buffer.from(
        `${options.username}:${options.apiToken}`
      ).toString("base64");
    }

    if (options.basicAuthEncodedString) {
      this.headers.Authorization = `Basic ${options.basicAuthEncodedString}`;
    }
  }

  /**
	 * Build the request object
	 *
	 * @param {object} options
	 * @return {object}
	 */
  buildRequest(options = {}) {
    let baseOptions = {
      hostname: this.hostname,
      path: `${options.path}/api/json`,
      headers: this.headers
    };

    if (options.tree !== "") {
      baseOptions.path = `${baseOptions.path}?tree=${options.tree}`;
    }

    // TODO: not sure if this is quite right - could end up with objects with props not required
    return Object.assign(options, baseOptions);
  }

  /**
	 * Perform the request
	 *
	 * @param {object} request
	 * @param {object} body
	 * @return Promise
	 */
  doRequest(request, body = {}) {
    // TODO: work out if post/put/get and change request accordingly

    return new Promise((resolve, reject) => {
      body = JSON.stringify(body);

      var req = protocolAdapters[this.protocol]
        .request(request, res => {
          let rawData = "";
          res.setEncoding("utf8");
          res.on("data", chunk => (rawData += chunk));
          res.on("end", () => resolve(JSON.parse(rawData)));
        })
        .on("error", e => {
          reject(`Got error: ${e.message}`);
        });

      //req.write(body);
      req.end();
    });
  }

  /**
	 * Get job information
	 *
	 * @param String job
	 * @param String tree
	 * @return Promise
	 */
  getJob(job, tree = "") {
    return this.doRequest(
      this.buildRequest({
        path: `/job/${job}`,
        tree: tree
      })
    );
  }

  /**
	 * Get build information
	 *
	 * @param String job
	 * @param String build
	 * @param String tree
	 * @return Promise
	 */
  getBuild(job, build, tree = "") {
    return this.doRequest(
      this.buildRequest({
        path: `/job/${job}/${build}`,
        tree: tree
      })
    );
  }

  /**
	 * Get SCM changes from a build
	 *
	 * @param String job
	 * @param String build
	 * @return Promise
	 */
  getScmChanges(job, build) {
    return this.getBuild(job, build, "changeSet[items[comment]]");
  }
}

module.exports = Jenkins;
