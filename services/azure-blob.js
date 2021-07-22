var azure = Npm.require("azure-storage")
// import azure from "azure-storage"

Slingshot.AzureBlobStorage = {

  AzureStorageConnectionString: "AzureStorageConnectionString",
  AzureAccountName: "AzureAccountName",

  directiveMatch: {
    container: String,
    containerUrl: Match.OneOf(String, Function),
    acl: Match.Optional(Match.Where(function (acl) {
      check(acl, String);

      return [
          "private",
          "public-read",
          "public-read-write",
          "authenticated-read",
          "bucket-owner-read",
          "bucket-owner-full-control",
          "log-delivery-write"
        ].indexOf(acl) >= 0;
    })),

    key: Match.OneOf(String, Function),
    AzureAccountName: String,
    AzureStorageConnectionString: String,

    expire: Match.Where(function (expire) {
      check(expire, Number);

      return expire > 0;
    }),

    cacheControl: Match.Optional(String),
    contentDisposition: Match.Optional(Match.OneOf(String, Function, null))
  },

  directiveDefault: _.chain(Meteor.settings)
    .pick("AzureStorageConnectionString", "AzureAccountName")
    .extend({
      container: Meteor.settings.AzureBlobContainer,
      containerUrl: function (container, accountName) {
        return "https://" + accountName + ".blob.core.windows.net/" + container;
      },
      expire: 5 //in 5 minutes
    })
    .value(),

  getContentDisposition: function (method, directive, file, meta) {
    var getContentDisposition = directive.contentDisposition;

    if (!_.isFunction(getContentDisposition)) {
      getContentDisposition = function () {
        var filename = file.name && encodeURIComponent(file.name);

        return directive.contentDisposition || filename &&
          "inline; filename=\"" + filename + "\"; filename*=utf-8''" +
          filename;
      };
    }

    return getContentDisposition.call(method, file, meta);
  },

  /**
   *
   * @param {{userId: String}} method
   * @param {Directive} directive
   * @param {FileInfo} file
   * @param {Object} [meta]
   *
   * @returns {UploadInstructions}
   */

  upload: function (method, directive, file, meta) {
    var policy = new Slingshot.StoragePolicy()
          .expireIn(directive.expire)
          .contentLength(0, Math.min(file.size, directive.maxSize || Infinity)),

        payload = {
          key: _.isFunction(directive.key) ?
            directive.key.call(method, file, meta) : directive.key,

          container: directive.container,

          "Content-Type": file.type,
          "acl": directive.acl,

          "Cache-Control": directive.cacheControl,
          "Content-Disposition": this.getContentDisposition(method, directive,
            file, meta)
        },

        containerUrl = _.isFunction(directive.containerUrl) ?
          directive.containerUrl(directive.container, directive[this.AzureAccountName]) :
          directive.containerUrl,

        downloadUrl = [
          (directive.cdn || containerUrl),
          payload.key
        ].map(function (part) {
            return part.replace(/\/+$/, '');
          }).join("/");

    process.env.AZURE_STORAGE_CONNECTION_STRING = directive[this.AzureStorageConnectionString]
    var blobService = azure.createBlobService()
    var startDate = new Date()
    var expiryDate = new Date(startDate)
    expiryDate.setMinutes(startDate.getMinutes() + directive.expire)
    startDate.setMinutes(startDate.getMinutes() - directive.expire)

    var sharedAccessPolicy = {
      AccessPolicy: {
        Permissions: azure.BlobUtilities.SharedAccessPermissions.WRITE,
        Start: startDate,
        Expiry: expiryDate
      }
    }
    var token = blobService.generateSharedAccessSignature(directive.container, payload.key, sharedAccessPolicy);
    var sasUrl = blobService.getUrl(directive.container, payload.key, token)

    return {
      upload: sasUrl,
      download: downloadUrl,
      postData: [{
        name: "ignore",
        value: null
      }],
      method: "PUT",
      headers: {"x-ms-blob-type": "BlockBlob"},
    };
  },
};
