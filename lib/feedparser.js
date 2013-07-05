var xpath = require("xpath");
var xmldom = require("xmldom");
var parser = require('ortoo-feedparser');
/**
 * @typedef FeedParser
 * @type {Object}
 */
var feedparser = {
    /**
     * search a url for rss feeds
     * @param {String} url
     * @param {Object} options
     * @return {Object}
     */
    parse:function (url, options) {
        return parser.parseUrl(url, options);
    },
    /**
     * parse a xml string from google and extract its xmlUrls
     * @param {String} xmlstring
     * @param {Function} callback
     * @return {void}
     */
    parseFromGoogleXmlString:function (xmlstring, callback) {
        var doc, dom, result;
        try {
            doc = new xmldom.DOMParser();
            dom = doc.parseFromString(xmlstring);
            result = xpath.select("//outline/@xmlUrl", dom).map(function (r) {
                return r.value;
            });
            callback(undefined, result);
        } catch (error) {
            callback(error);
        }
    }
};

module.exports = function (container) {
    container.share("feedparser", function () {
        return feedparser;
    });
};
