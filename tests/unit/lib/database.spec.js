/*jslint node:true, es5: true, white: true ,plusplus: true,nomen: true, sloppy: true */
/*globals describe,it,expect,beforeEach */
var Pimple = require("pimple");
var config = require("lib/config");
var assert = require("assert");

assert.notNull = function (o) {
    if (o === null) {
        console.error(o);
        throw "object is null";
    }
};

assert.null = function (o) {
    if (o !== null) {
        console.error(o);
        throw "object is not null";
    }
};

assert.true = function (o) {
    if (o !== true) {
        console.error(o);
        throw "object is not true";
    }
};


describe("A Container", function () {
    /**
     *
     * @type {Pimple}
     */
    var db, Feed, container = new Pimple();
    it("is created", function () {
        assert.notNull(container);
        container.register(config, {"db.connection":process.env.MONGO_FEEDPRESS_TEST});

        assert.notEqual(container.get("db"), null);
        assert.notEqual(container.db, null);

        db = container.db;

        beforeEach(function (done) {
            container.db.model('Feed').remove(function (err) {
                done();
            });
        });

        describe("A Feed", function () {
            Feed = db.model('Feed');
            var feed;
            it("is instanciated, is instance of Feed", function () {
                feed = new Feed({xmlurl:'http://speckyboy.com/feed/', link:'http://speckyboy.com', title:'Speckyboy Design Magazine'});
                assert.equal(feed instanceof db.models.Feed, true);
                describe("Some operations are performed", function () {
                    it("is saved to the database", function (done) {
                        feed.save(function (err, feed) {
                            assert.null(err);
                            assert.notNull(feed);
                            done();
                        });
                    });
                });
            });
        });

    });
});
