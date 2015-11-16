const config = Meteor.settings.rest2ddp;

if(!config) {
  return;
}

const verbose = config.verbose;

log = function () {
  if(verbose) {
    let args = Array.prototype.slice.call(arguments);
    args.unshift("REST2DDP:");
    console.log.apply(this, args);
  }
};
