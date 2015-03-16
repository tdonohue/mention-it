**07 March 2010:**  Version 1.5 is available!  See the [README](http://mention-it.googlecode.com/svn/trunk/README) for more details on latest changes.

| A [live demo of Mention-It](http://mention-it.googlecode.com/svn/trunk/example.html) which searches for references to this site (http://mention-it.googlecode.com or #MentionIt) out on the web. |
|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|

Mention-It is a simple javascript library to aggregate "mentions" of content held within an institutional repository (or personal blog/webpage) from across the web.

Mention-It is built using the following technologies:
  * jQuery - http://jquery.com/
  * Google AJAX Feed API - http://code.google.com/apis/ajaxfeeds/
  * Twitter API - http://twitter.com
  * FriendFeed API - http://friendfeed.com

Currently, Mention-It searches the following web sources for mentions from around the web:
  * Twitter - http://twitter.com
  * FriendFeed - http://friendfeed.com
  * Google Blog Search - http://blogsearch.google.com/
  * ~~Technorati - http://technorati.com~~
    * Technorati currently doesn't work as they changed their search results RSS feeds to require signup

Mention-It can also be easily extended (i.e. modified) to search any site that allows users to subscribe to an RSS or ATOM feed of search results.  If you make any interesting modifications, let me know or post a patch in the "Issues" section.  I'd definitely love to have others' cool hacks to make it back into the code (and yes, you will be attributed/mentioned as having helped make Mention-It even better).

More summaries of Mention-It on the Web:
  * Mention-It Overview/Demo Video: http://www.vimeo.com/4751173
  * Mention-It was the RepoChallenge winner at [Open Repositories 2009](http://www.openrepositories.org):  http://dev8d.jiscinvolve.org/2009/05/20/repochallenge-winners/
  * More details about RepoChallenge win from http://bibapp.org: http://bibapp.org/2009/05/20/tim-donohue-wins-or2009-developer-challenge/

Known Issues:
  * Twitter's API only searches the last ~2 weeks worth of tweets -- so older content is never returned.  This is just how the [Twitter search engine](http://search.twitter.com/) works!
  * ~~FriendFeed's API is sometimes extremely slow (no idea why) -- so it times out on occasion or will sometimes return no results.~~
    * _Fixed on Trunk code (to be released soon)_ -- FriendFeed API doesn't seem to like URL-based searches (unfortunately).  So, all URL-based searches no longer use FriendFeed (but all other searches will use FriendFeed, automatically)
  * ~~Google Blog Search doesn't search 'hashtags' very well (e.g. #MentionIt).  It always strips off the hash (#), so it ends up searching "MentionIt" instead of "#MentionIt".  Currently there doesn't seem to be a workaround.~~
    * _Fixed on Trunk code (to be released soon)_ -- All Google Blog Searches now filter out any hashtags.  So, if you are using hashtags with Mention-It they will not be searched using Google Blog search (but all other searches will use Google Blog Search, automatically)

If you like or use Mention-It, please mention it on the web (#MentionIt or mention-it.googlecode.com).  If you link to 'mention-it.googlecode.com' or '#MentionIt' on Twitter, FriendFeed or your blog, you should see your own mentions appear shortly thereafter in the [live demo](http://mention-it.googlecode.com/svn/trunk/example.html).

Also, feel free to send me a tweet ([@timdonohue](http://twitter.com/timdonohue)) about your usage / likes / dislikes.