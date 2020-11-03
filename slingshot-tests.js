import { expect } from "chai";
import directive from "./lib/directive";

describe("slingshot", function () {
  it("restrictions", function () {
    expect(1).to.be.equal(1);
    expect(function () {
      Slingshot.fileRestrictions("myFileUploads", {
        allowedFileTypes: ["image/png", "image/jpeg", "image/gif"],
        maxSize: 10 * 1024 * 1024, // 10 MB (use null for unlimited).
      });
    }).not.to.throw();
  });
  it("create a directive", function () {
    expect(function () {
      const directive = Slingshot.createDirective(
        "myFileUploads",
        Slingshot.S3Storage,
        {
          // Here we get a key from the Meteor settings (private)
          AWSAccessKeyId: Meteor.settings.private.ENV_S3_ACCESS_KEY_ID,
          // We deliberately don't get the secret from the same place,
          // We are going to test the reading of the default from Meteor.settings.AWSSecretAccessKey
          // AWSSecretAccessKey: Meteor.settings.private.ENV_S3_SECRET_ACCESS_KEY,
          bucket: Meteor.settings.private.ENV_DOCUMENTS_BUCKET,
          region: Meteor.settings.private.ENV_S3_REGION,

          acl: "public-read",

          // 'STANDARD' or 'REDUCED_REDUNDANCY'
          storageClass: "REDUCED_REDUNDANCY",

          authorize: function () {
            //Deny uploads if user is not logged in.
            if (!this.userId) {
              var message = "Please login before posting files";
              throw new Meteor.Error("Login Required", message);
            }

            return true;
          },

          key: function (file) {
            //Store file into a directory by the user's username.
            var user = Meteor.users.findOne(this.userId);
            return user.username + "/" + file.name;
          },
        }
      );
      // Check that the explicitly supplied key is there
      expect(directive._directive.AWSAccessKeyId).to.equal(
        Meteor.settings.private.ENV_S3_ACCESS_KEY_ID
      );
      // Check that the default key is picked up
      expect(directive._directive.AWSSecretAccessKey).to.equal(
        Meteor.settings.AWSSecretAccessKey
      );
    }).not.to.throw();
  });
});

/*
Important: The `fileRestrictions` must be declared before the directive is instantiated.

### Server side

On the server we declare a directive that controls upload access rules:

```JavaScript
Slingshot.createDirective("myFileUploads", Slingshot.S3Storage, {
  bucket: "mybucket", // This may be a String or a function

  acl: "public-read",

  // 'STANDARD' or 'REDUCED_REDUNDANCY'
  storageClass: 'REDUCED_REDUNDANCY', 

  authorize: function () {
    //Deny uploads if user is not logged in.
    if (!this.userId) {
      var message = "Please login before posting files";
      throw new Meteor.Error("Login Required", message);
    }

    return true;
  },

  key: function (file) {
    //Store file into a directory by the user's username.
    var user = Meteor.users.findOne(this.userId);
    return user.username + "/" + file.name;
  }
});
*/

// Slingshot.createDirective('privateUploads', Slingshot.S3Storage, {
//   AWSAccessKeyId: Meteor.settings.private.ENV_S3_ACCESS_KEY_ID,
//   AWSSecretAccessKey: Meteor.settings.private.ENV_S3_SECRET_ACCESS_KEY,
//   bucket: Meteor.settings.private.ENV_DOCUMENTS_BUCKET,
//   region: Meteor.settings.private.ENV_S3_REGION,

//   authorize: function () {
//     if (!this.userId) {
//       const message = 'Please login before posting files'
//       throw new Meteor.Error('Login Required', message)
//     }
//     return true
//   },

//   key: function (file, metaContext) {
//     const filename = `${metaContext.folder}/${metaContext.listing}/${metaContext.fileName}.pdf`
//     debug(`filename for upload is ${filename}`)
//     return filename
//   },
// })
