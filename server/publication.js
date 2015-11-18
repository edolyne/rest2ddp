const JsonPath = Npm.require("jsonpath");
const DeepDiff = Npm.require("deep-diff");

REST2DDP.publish = function (name, config) {
  config.publicationName = name;
  publishResource(config);
};

publishResource = function (config) {
  check(config, Object);
  check(config.collectionName, String);
  check(config.restUrl, String);
  // TODO check more config stuff

  const collectionName = config.collectionName;
  const publicationName = config.publicationName || collectionName;
  const pollInterval = config.pollInterval || 10;
  log("Setting up", publicationName);

  const getId = function (index) {
    return `${publicationName}-${index}`;
  };

  Meteor.publish(publicationName, function () {
    log("Starting publication", publicationName);

    const self = this;
    const lastResults = new Map();
    let stop = false;
    let timeoutHandle = null;

    const poll = () => {
      let rawResult;
      let result;

      try {
        rawResult = HTTP.get(config.restUrl, { headers: config.headers });
      }
      catch (e) {
        log(e);
        throw new Meteor.Error("HTTP-request-failed",
          "The HTTP request failed");
      }

      if (rawResult.statusCode !== 200) {
        throw new Meteor.Error("HTTP-error-code",
          "The HTTP request failed with status code: " + rawResult.statusCode);
      }

      if(config.jsonPath) {
        try {
          result = JsonPath.query(rawResult.data, config.jsonPath);
        }
        catch (e) {
          log(e);
          throw new Meteor.Error("result-parse-error",
            "Couldn't parse the results");
        }
      }
      else if(rawResult.data) {
        result = rawResult.data;
      }
      else {
        log("There was no data or configPath");
        throw new Meteor.Error("result-parse-error",
          "Couldn't parse the results");
      }

      var diff = DeepDiff.diff(lastResults.get(publicationName), result);
      var added = new Map();
      var removed = new Map();
      var changed = new Map();

      if (!lastResults.get(publicationName)) {
        log("Initial poll");

        for (let [index, record] of result.entries()) {
          let id = getId(index);
          self.added(collectionName, id, record);
        }
      }
      else if (diff) {
        log("Poll revealed changes");
        /*
          NOTE: We're not really taking advantage of the diff library right
          now. There are two issues:

          1. Unfortunately we can't tell yet that an object was inserted into
          the array and the following items just shifted down, currently all
          items after the inserted one will appear as changes.
          We might as well be just walking the two arrays (result and
          lastResults) and doing a changed event for each object that"s
          different.

          2. Changes should be just the (top-level) field that changed. Right
          now we send the whole object (all fields). The diff library *can* tell
          us exactly which fields changed but we're not using it.

          We"ll fix those in a future iteration.
        */
        for (let diffItem of diff) {
          let diffKind = diffItem.kind;

          if (diffKind === "A" && diffItem.index && !diffItem.path) {
            if (diffItem.item.kind === "D") {
              removed.set(diffItem.index, true);
            }
            else if (diffItem.item.kind === "N") {
              added.set(diffItem.index, result[diffItem.index]);
            }
          }
          else if (diffKind === "A" && diffItem.path) {
            changed.set(diffItem.path[0], result[diffItem.path[0]]);
          }
          else if (diffKind === "E") {
            changed.set(diffItem.path[0], result[diffItem.path[0]]);
          }
          else if (diffKind === "N" && diffItem.path) {
            changed.set(diffItem.path[0], result[diffItem.path[0]]);
          }
          else if (diffKind === "D" && diffItem.path) {
            changed.set(diffItem.path[0], result[diffItem.path[0]]);
          }
          else {
            log("Unhandled change", diffItem);
          }
        }
      }
      else {
        log("Poll revealed no changes");
      }

      added.forEach((doc, index) => {
        log("Added", index);
        self.added(collectionName, getId(index), doc);
      });
      removed.forEach((doc, index) => {
        log("Removed", index);
        self.removed(collectionName, getId(index));
      });
      changed.forEach((doc, index) => {
        log("Changed", index);
        // This is really inefficient but for now we're not tracking changes by
        // field so to be sure that we unset any field that has been removed we
        // remove and re-add the object. 😰
        // Soon we'll diff the object with the old one and send the changes.
        self.removed(config.collectionName, getId(index));
        self.added(config.collectionName, getId(index), doc);
      });

      lastResults.set(publicationName, result);

      if(!stop) {
        /*
          Some APIs might be inconsistent in their response times. Using
          setTimeout rather than setInterval ensures we don't query the endpoint
          before the previous query returns.
        */
        timeoutHandle = Meteor.setTimeout(poll, pollInterval * 1000);
      }
    };

    /*
      Basically just skip these REST2DDP pubs/subs during SSR because, with 
      network latency, they are not going to be ready anyway. Also, the context
      under which the publications are called
      (https://github.com/kadirahq/fast-render/blob/master/lib/server/context.js)
      does not support .added, .ready, etc. This is the context used by
      meteor-react-router-ssr
      (https://github.com/thereactivestack/meteor-react-router-ssr/blob/cd3d35383c1ceb4fb3639a11a4fdc82cf4a48cd7/lib/server.jsx#L67)
    */
    if(self.added) {
      // Poll calls itself via setTimeout as long as stop is falsy
      poll();
      self.ready();

      self.onStop(() => {
        log("Stopping publication", publicationName);
        stop = true;
        if(timeoutHandle) {
          Meteor.clearTimeout(timeoutHandle);
        }
      });
    }
    else {
      return [];
    }
  });
};
