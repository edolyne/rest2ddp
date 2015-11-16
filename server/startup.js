Meteor.startup(function () {
  const settings = Meteor.settings.rest2ddp;

  if(!settings) {
    console.log("REST2DDP: There are no settings");
    return;
  }

  const configs = settings.configs;

  if(!configs || !configs.length) {
    console.log("REST2DDP: There are no configs within the settings");
    return;
  }

  for(const config of configs) {
    publish(config);
  }
});
