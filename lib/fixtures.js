/**
 *
 * @type {Object}
 */
module.exports = {
    articles:[
        {
            __v:0,
            categories:[
                "Actionscript / Flash",
                "MXNA"
            ],
            description:"<p>Adobe added <a href=\"http://help.adobe.com/en_US/FlashPlatform/beta/reference/actionscript/3/JSON.html\" target=\"_blank\">native support for JSON</a> in Flash 11, which was released a few months ago. I&#8217;ve added a new argument to the blocking JSON functions (decodeJson and encodeJson) that will use native JSON if it is available.</p>\n<p>Basically, this allows anyone who wants to get a free speed boost among Flash 11 users, while still staying compatible (and fast) amongst users still using Flash 9 and 10. Read the documentation in encodeJson.as and decodeJson.as for more information on compatibility differences.</p>\n<p>As much as I hate to say it, projects targeting Flash 11+ should not use blocking JSON functions. While they are still very fast, AS3 can&#8217;t compete with native code, and libraries like actionjson should only be used when necessary. There&#8217;s still no equivalent to the asynchronous JSON encoder and decoder, so they&#8217;re still useful, although this will also likely change with the release of <a href=\"http://matthewfabb.com/blog/2010/11/11/multithreading-is-finally-coming-to-flash/\" target=\"_blank\">Actionscript Workers</a>.</p>",
            guid:"http://blog.brokenfunction.com/?p=557",
            link:"http://blog.brokenfunction.com/2012/02/actionjson-1-4/",
            meta:{
                categories:[],
                favicon:"http://blog.brokenfunction.com/favicon.ico",
                language:"en",
                xmlUrl:"http://blog.brokenfunction.com/feed/",
                xmlurl:"http://blog.brokenfunction.com/feed/",
                link:"http://blog.brokenfunction.com",
                pubdate:"2012-04-02T15:39:01Z",
                description:"I'll write a witty tagline later.",
                title:"BrokenBlog"
            },
            pubDate:"2012-02-06T03:11:32Z",
            summary:"Adobe added native support for JSON in Flash 11, which was released a few months ago. I&#8217;ve added a new argument to the blocking JSON functions (decodeJson and encodeJson) that will use native JSON if it is available. Basically, this allows anyone who wants to get a free speed boost among Flash 11 users, while [...]",
            tags:[],
            title:"actionjson 1.4"
        }
    ],
    feeds:[
        {
            title:"feed1",
            xmlurl:"http://site1/feed",
            link:"http://site1"
        },
        {
            title:"feed2",
            xmlurl:"http://site2/feed",
            link:"http://site2"
        }
    ],

    categories:[
        {
            title:"category1"
        }
    ]
};