/* The Mention-It Javascript Library
 
Copyright (c) 2009 Tim Donohue

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// Technologies used:
//    jQuery:   http://jquery.com/
//    Google AJAX Feed API: http://code.google.com/apis/ajaxfeeds/

//------- Mention-It Configuration -------
// Use this area to make some minor tweaks to how you want mention-it to function

//how many results per enabled service to return
var resultsPerService = 5; 

// Temporary "searching" message which is displayed until first set of results are found
var searchingForMentions = "Searching for mentions out on the web....";

//Heading (placed at beginning of a <div id='mentions-header'> by default)
var headingPreface = "Recent mentions via"; 

// List of all JSON-based trackers.  Config below is formatted in JSON,
// [[query]] is the placeholder for the Query text
// [[resultsCount]] is the placeholder for how many results to return per service
// NOTE: To remove a site, just remove or comment out all its settings below
var jsonTrackers = {
	"sites":
	  [ //Config for Twitter (results parsed by parse_twitter_json() function)
	  	{"title": "Twitter",
	  	 "jsonURL" : "http://search.twitter.com/search.json?rpp=[[resultsCount]]&q=[[query]]&callback=?",
	  	 "booleanOR" : "OR",
	  	 "parser" : "parse_twitter_json"
	  	}, //Config for FriendFeed (results parsed by parse_friendfeed_json() function)
	  	{"title": "FriendFeed",
	  	 "jsonURL" : "http://friendfeed.com/api/feed/search?num=[[resultsCount]]&q=[[query]]&callback=?",
	  	 "booleanOR" : "OR",
	  	 "parser" : "parse_friendfeed_json"
	  	}
	  ]
}

// List of all RSS/ATOM search feeds.  Config below is formatted in JSON,
// [[query]] is the placeholder for the Query text
// NOTE: To remove a site, just remove or comment out all its settings below
var searchFeeds = { 
    "sites":
      [  //Config for Google Blog Search
        {"title": "Google Blog Search",
         "feedURL": "http://blogsearch.google.com/blogsearch_feeds?hl=en&q=[[query]]&ie=utf-8&num=5&output=atom", 
         "searchURL": "http://blogsearch.google.com/blogsearch?hl=en&ie=UTF-8&q=[[query]]&btnG=Search+Blogs",
         "siteURL": "http://blogsearch.google.com/",
         "booleanOR": "OR"
        }, //Config for Ask.com Blog Search
        {"title": "Ask.com Blog Search",
         "feedURL": "http://ask.bloglines.com/search?q=[[query]]&ql=&format=rss",
         "searchURL": "http://www.ask.com/blogsearch?q=[[query]]",
         "siteURL": "http://www.ask.com/blogsearch",
         "booleanOR": "OR"
        }
        /* NOTE: As of March 2010, Technorati changed how its RSS
           is generated and it no longer works well with Google AJAX Feed API
         ,
        {"title": "Technorati",
         "feedURL": "http://feeds.technorati.com/search/[[query]]?language=n",
         "searchURL": "http://technorati.com/search/[[query]]?language=n",
         "siteURL": "http://technorati.com/",
         "booleanOR": "OR"
        }*/
      ]
}

// Not required, but can be useful to contact you if Google has problems
// with your usage of Google AJAX Feed API. For more info, see:
//    http://code.google.com/apis/ajaxfeeds/key.html
var googleAJAXFeedKey = "";


//-------- The Mention-It Code -------
// this is where the magic happens!

// Global variables
var mentionItTag = null;
var mentionItQuery;

// ==== Initializers =====

//Once document finishes loading,
//PERFORM INITIALIZATION TASKS
jQuery(document).ready(
    function()
    {
        // Locate HTML tag where all our "mentions" will be placed
        mentionItTag = jQuery("#mention-it");

        //Only continue if the "mention-it" tag was found
        if(tagExists(mentionItTag))
        {
            // Query specified in the HTML tag's title attribute
            mentionItQuery = mentionItTag.attr("title");

			//initialize all our trackers
            initJSONTrackers();
            initFeedTrackers();
            
            //For everything else (Twitter/FF, etc), replace semicolons(;) with boolean OR
            // also URL escape the query.
            mentionItQuery = mentionItQuery.replace(/\s*\;\s*/, " OR ");
            mentionItQuery = escape(mentionItQuery);
            
            //When first AJAX query begins, display "Searching for mentions"
            //  After first AJAX query completes successfully, remove that message.
            mentionItTag.ajaxStart(function() {
                jQuery(this).append("<div id='mentions-loading'>" + searchingForMentions + "</div>");
             }).ajaxSuccess(function() {
                jQuery('#mentions-loading').remove();
             })
            
            //uncomment for query debugging
            //alert("Query=" + mentionItQuery);        
        }//end if mentionItTag found
    });

//Initialize each of the RSS/ATOM Feed Trackers
function initFeedTrackers()
{
   	//Initialize each of the RSS/ATOM Feed sites:
   	//update the query placeholder in each of the site URLs
	jQuery.each(searchFeeds.sites, function(i, site){
		var queryForSite = mentionItQuery;

		//default boolean OR to just "OR" if unspecified for a site
		if(site.booleanOR==null || site.booleanOR=="") site.booleanOR="OR";

		//replace semicolons(;) with boolean OR, and URL escape the query
		queryForSite = mentionItQuery.replace(/\s*\;\s*/, " " + site.booleanOR + " ");
		queryForSite = escape(queryForSite);

		//replace the [[query]] placeholder with site-specific query
		site.feedURL = site.feedURL.replace(/\[\[query\]\]/, queryForSite);
		site.searchURL = site.searchURL.replace(/\[\[query\]\]/, queryForSite);
	});
}

//Initialize each of the JSON Feed Trackers
function initJSONTrackers()
{
   	//Initialize each of the JSON sites:
   	//update the query placeholder in each of the site URLs
	jQuery.each(jsonTrackers.sites, function(i, site){
		var queryForSite = mentionItQuery;

		//default boolean OR to just "OR" if unspecified for a site
		if(site.booleanOR==null || site.booleanOR=="") site.booleanOR="OR";

		//replace semicolons(;) with boolean OR, and URL escape the query
		queryForSite = mentionItQuery.replace(/\s*\;\s*/, " " + site.booleanOR + " ");
		queryForSite = escape(queryForSite);

		//replace the [[query]] placeholder with site-specific query
		site.jsonURL = site.jsonURL.replace(/\[\[query\]\]/, queryForSite);
		
		//replace the [[resultsCount]] placeholder with site-specific query
		site.jsonURL = site.jsonURL.replace(/\[\[resultsCount\]\]/, resultsPerService);
	});
}


// ==== Searchers / Parsers =====

// Once document finishes loading, call loadJSONTrackers()
jQuery(document).ready(loadJSONTrackers);

// Second, load all Feed (RSS/ATOM) Trackers, using Google AJAX API
loadFeedTrackers();

// Load all of our JSON web trackers to search for mentions out on the web.
function loadJSONTrackers()
{
	//for each configured site
	jQuery.each(jsonTrackers.sites, function(i, site){
	
		//load the JSON search URL, and evaluate the results using the appropriate parser function
		jQuery.getJSON(site.jsonURL, eval(site.parser));
    });
}

// Parse the JSON results from a Twitter search into an HTML <div>
function parse_twitter_json(data)
{
  var postsHTML = '';
  var sectionHeader = '';
	
  //for each of the json results,
  jQuery.each(data.results,
    function(i, result)
    {
      //parse out the info we want from json
      var icon = result.profile_image_url;
      var user = result.from_user;
      var tweet = result.text;

      var tweet_id = result.id;
      var user_link = 'http://twitter.com/'+user;
      var tweet_link ='http://twitter.com/'+user+'/status/'+tweet_id;
      var postedAt = result.created_at;
	
		
      //Append this tweet onto HTML output string
      postsHTML += "<div class='mention-post'>"
          + "<a href='"+user_link+"'>"+user+"</a>: "
          + tweet
          + " <a href='"+tweet_link+"'>"+postedAt+"</a>"
          + "</div>";
    });
	
	if(data.results.length>0)
	{
		sectionHeader = "<div class='mentions-header'>"
		 	+ headingPreface + " "
			+ "<a href='http://twitter.com'>Twitter</a>:"
			+ " [<a href='http://search.twitter.com/search?q="+mentionItQuery+"'>view all</a>]"
			+ "</div>";
		mentionItTag.append(sectionHeader);
		
		
		//add all results to a new "mentions" <div>, within the "mention-it" tag
		jQuery("<div class='mentions'/>").append(postsHTML).appendTo(mentionItTag);
	}
}//end parse_twitter_json


// Parse the JSON results from a FriendFeed search into an HTML <div>
function parse_friendfeed_json(data)
{
	var postsHTML = '';
	var sectionHeader = '';
	
	//for each of the json results, 
	jQuery.each(data.entries, function(i, entry){
			
		//parse out the info we want from json
		var user = entry.user.nickname;
		var post = entry.title;

		var user_link = 'http://friendfeed.com/'+user;
		var postedAt = entry.updated;

		
		//Append this tweet onto HTML output string
		postsHTML += "<div class='mention-post'>"
			+ "<a href='"+user_link+"'>"+user+"</a>: "
			+ post 
			+ " " + postedAt;
		
		//If there are comments, add them in a sublist
		if(entry.comments.length>0)
		{
		      var maxComments = 5; //show a max of 5 comments
		      if(entry.comments.length < maxComments) maxComments = entry.comments.length;
	
		      postsHTML += "<div class='mention-comments'>";
		      for (j=0;j<maxComments;j++)
		      {
				user = entry.comments[j].user.nickname;
				post = entry.comments[j].body;
				user_link = 'http://friendfeed.com/'+user;
				postedAt = entry.comments[j].date;
				postsHTML += "<div class='mention-comment'>"
					  + post
					  + " " + postedAt
					  + " (<a href='"+user_link+"'>"+user+"</a>)"
					  + "</div>";
		      }
          //close off this set of comments
		      postsHTML += "</div>";
		}
		
		//close off this entry
		postsHTML += "</div>";
	});
	
	if(data.entries.length>0)
	{
      sectionHeader = "<div class='mentions-header'>"
        + headingPreface + " "
        + "<a href='http://friendfeed.com'>FriendFeed</a>:"
        + " [<a href='http://friendfeed.com/search?q="+mentionItQuery+"'>view all</a>]"
        + "</div>";
      mentionItTag.append(sectionHeader);

      //add all results to a new "mentions" <div>, within the "mention-it" tag
      jQuery("<div class='mentions'/>").append(postsHTML).appendTo(mentionItTag);
	}
}//end parse_friendfeed_json



// Load any RSS/ATOM feeds using Google AJAX Feed API
function loadFeedTrackers()
{
    // tell Google we are using version 1.0 of AJAX Feed API
    google.load("feeds", "1");
    // Call the parse_feeds() method to actually parse/display our feeds
    google.setOnLoadCallback(parse_feeds);
}

// Parse RSS/ATOM Feed results using the Google AJAX Feed API
function parse_feeds()
{
	//Load the feeds using Google AJAX Feed API
	//We will be parsing them using the default JSON results format
	
	// Only contine if the 'mention-it' tag exists
	if(tagExists(mentionItTag))
	{
		//For each of our specified feeds, we'll parse them one by one
		jQuery.each(searchFeeds.sites, function(i, site){
			   var feed = new google.feeds.Feed(site.feedURL);
			   
			   //load and parse the feed
			   feed.load(function(data) {
							  
				//as long as we got no errors in retrieving data
				if(!data.error)
				{
					var postsHTML = "";

					//for each of the json results,
					jQuery.each(data.feed.entries, function(i, entry){

						  //Append this tweet onto HTML output string
						  postsHTML += "<div class='mention-post'>"
						+ "<div class='mention-title'><a href='"+entry.link+"'>"+entry.title+"</a></div>"
						+ "<div class='mention-author'>" + entry.author + "</div>"
						+ "<div class='mention-date'>"+ entry.publishedDate+"</div>"
						+ "<div class='mention-snippet'>"+ entry.contentSnippet+"</div>"
						+ "</div>";
					});

					//only show section header if we have results!
					if(data.feed.entries.length > 0)
					{
						var sectionHeader = "<div class='mentions-header'>"
						  + headingPreface + " "
						  + "<a href='" + site.siteURL + "'>" + site.title + "</a>"
						  + " [<a href='"+site.searchURL+"'>view all</a>]"
						  + "</div>";
						mentionItTag.append(sectionHeader);

						//add all results to a new "mentions" <div>, within the "mention-it" tag
						jQuery("<div class='mentions'/>").append(postsHTML).appendTo(mentionItTag);
					}//end if results
				} //end if no errors   
			   }); //end feed.load
		}); //end jQuery.each
		
	} //end if mention-it tag found
}//end parse_feeds


// Automated parsing of feeds, using the Google "FeedControl" class
//  (NOTE: not used by default, since it makes the RSS/ATOM results look different than JSON results)
function parse_feeds_auto()
{
    //Load the feeds into Google AJAX Feed API's "FeedControl" class,
    // as it provides a nice tabbed structure and look-and-feel out of the box.
    // http://code.google.com/apis/ajaxfeeds/documentation/#FEEDCONTROL
    var feedControl = new google.feeds.FeedControl();

    //For each of the feeds specified in global 'searchFeed',
    // add them to Google's "FeedControl" class
    jQuery.each(searchFeeds.sites, function(i, site){
        feedControl.addFeed(site.feedURL, site.title);
    });

    //draw the feed controller, in a tabbed format
    feedControl.draw(document.getElementById("mention-feed"), {drawMode: google.feeds.FeedControl.DRAW_MODE_TABBED});
}

// ==== Utilities ====

// checks if a particular tag exists using JQuery
// takes in a JQuery object (e.g. jQuery("#my-id"))
function tagExists(jqueryTag)
{
	if(jqueryTag!=null && jqueryTag.length)
	{
		return true;
	}
	else
	{
		return false;
	}
}
	
