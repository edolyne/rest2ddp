Package.describe({
  name: "newspring:rest2ddp",
  version: "0.0.3",
  summary: "Publish a live updating DDP API for any existing REST API",
  git: "https://github.com/NewSpring/rest2ddp.git",
  documentation: "README.md"
});

Package.onUse(function(api) {
  api.versionsFrom("1.2.1");
  api.use("ecmascript");
  api.use("check");
  api.use("http");

  api.addFiles("server/_vars.js", "server");
  api.addFiles("server/log.js", "server");
  api.addFiles("server/publication.js", "server");
  api.addFiles("server/startup.js", "server");

  api.export("REST2DDP", "server");
});

Npm.depends({
  "deep-diff": "0.3.2",
  "jsonpath": "0.2.0"
});
