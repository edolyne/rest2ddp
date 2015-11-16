# newspring:rest2ddp

This Meteor package uses the amazing work done by "OK GROW!" to allow apps
to publish REST resources directly to the client (hence: rest to ddp).

https://github.com/okgrow/rest2ddp

## Installation

```bash
meteor add newspring:rest2ddp
```

## Server setup

After the package is installed, there are two methods for setting up
publications. You can use one or both:

### settings.json method

Add a settings file or add an object to your existing settings file that looks
like this:

```json
{
  "rest2ddp": {
    "verbose": true,
    "configs": [
      {
        "publicationName": "thePublication",
        "collectionName": "theCollection",
        "restUrl": "https://sub.domain.com/api/v1/widgets",
        "jsonPath": "$.query.results.channel.item.forecast.*",
        "secondsBetweenPolling": 5,
        "headers": {
          "Authorization-Token": "123456789",
          "Other-Header-Key": "Other-Header-Value"
        }
      },
      {
        "collectionName": "otherCollection",
        "restUrl": "http://sub.otherdomain2.com/api/v2/people"
      }
    ]
  }
}
```

### Traditional publish method

Put code like this in a server block:

```js
REST2DDP.publish("thePublication", {
  collectionName: "theCollection",
  restUrl: "https://sub.domain.com/api/v1/widgets",
  jsonPath: "$.query.results.channel.item.forecast.*",
  secondsBetweenPolling: 5,
  headers: {
    "Authorization-Token": "123456789",
    "Other-Header-Key": "Other-Header-Value"
  }
});
```

## Client setup

Access the data on the client like this:

```js
theCollection = new Mongo.Collection("theCollection");
Meteor.subscribe("thePublication");
Tracker.autorun(function () {
  console.table(theCollection.find().fetch());
});

otherCollection = new Mongo.Collection("otherCollection");
Meteor.subscribe("otherCollection");
Tracker.autorun(function () {
  console.table(otherCollection.find().fetch());
});
```
