Package.describe({
  name: 'mikkelking:slingshot',
  summary: 'Directly post files to cloud storage services, such as AWS-S3.',
  version: '1.0.0',
  git: 'https://github.com/Back2bikes/meteor-slingshot',
})

Package.onUse(function (api) {
  api.versionsFrom('METEOR@1.0');

  api.use(['check', 'ecmascript'])
  api.use(['underscore'], 'server')
  api.use(['tracker', 'reactive-var'], 'client')

  api.addFiles([
    "lib/restrictions.js",
    "lib/validators.js"
  ]);

  api.addFiles("lib/upload.js", "client");

  api.addFiles([
    "lib/directive.js",
    "lib/storage-policy.js",
    "services/aws-s3.js",
    "services/google-cloud.js",
    "services/rackspace.js"
  ], "server");

  api.export('Slingshot')
})

Package.onTest(function (api) {
  api.use(["tinytest", "underscore", "edgee:slingshot"]);
  api.addFiles("test/aws-s3.js", "server");
});
