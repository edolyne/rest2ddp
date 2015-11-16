Meteor.startup(function () {
  const settings = Meteor.settings.rest2ddp;

  if(!settings) {
    log("REST2DDP: There are no settings");
    return;
  }

  const configs = settings.configs;

  if(!configs || !configs.length) {
    log("REST2DDP: There are no configs within the settings");
    return;
  }

  for(const config of configs) {
    publishResource(config);
  }
});
