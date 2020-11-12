Package.describe({
  name: 'mikkelking:slingshot',
  summary: 'Directly post files to cloud storage services, such as AWS-S3.',
  version: '1.0.0',
  git: 'https://github.com/Back2bikes/meteor-slingshot',
})

Package.on_use(function (api) {
  api.versionsFrom('METEOR@1.0')

  api.use(['check', 'ecmascript'])
  api.use(['underscore'], 'server')
  api.use(['tracker', 'reactive-var'], 'client')

  api.add_files(['lib/restrictions.js', 'lib/validators.js'])

  api.add_files('lib/upload.js', 'client')

  api.add_files(
    [
      'lib/directive.js',
      'lib/storage-policy.js',
      'services/aws-s3.js',
      'services/google-cloud.js',
      'services/rackspace.js',
    ],
    'server'
  )

  api.export('Slingshot')
})

// Package.on_test(function (api) {
//   api.use(["tinytest", "underscore", "mikkelking:slingshot"]);
//   api.add_files("test/aws-s3.js", "server");
// });

Package.onTest(function (api) {
  // You almost definitely want to depend on the package itself,
  // this is what you are testing!
  api.use('mikkelking:slingshot')

  // You should also include any packages you need to use in the test code
  api.use(['ecmascript', 'random', 'meteortesting:mocha'])

  // Finally add an entry point for tests
  api.mainModule('slingshot-tests.js')
})
