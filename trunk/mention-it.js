/* The Mention-It Javascript Library
 
Copyright (c) 2009-2010 Tim Donohue

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

// List of all Site trackers.  Configuration is formatted in JSON syntax.
// NOTE: To remove a site, just remove or comment out all its settings below
//
// There are two types of sites configurations:
//  (1) Site with JSON API -- 'jsonURL' property required (results parsed using specified 'parser')
//  (2) Site with Search RSS/ATOM Feed -- 'feedURL' property required (results parsed using Google AJAX Feed API)
// Placeholders
//  [[query]] is placeholder for any Query text (URL or tag)
//  [[resultsCount]] is the placeholder for how many results to return per service
var siteTrackers = {
	"sites":
	  [ //Config for Twitter (results parsed by parse_twitter_json() function)
	  	{"id": "twitter",  //ID should be unique -- don't change
	  	 "title": "Twitter",
	  	 "jsonURL" : "http://search.twitter.com/search.json?rpp=[[resultsCount]]&q=[[query]]&callback=?",
	  	 "searchURL": "http://search.twitter.com/search?q=[[query]]",
	  	 "siteURL" : "http://twitter.com",
	  	 "queryFormatter" : "default_query_formatter",
	  	 "parser" : "parse_twitter_json"
	  	}, //Config for FriendFeed (results parsed by parse_friendfeed_json() function)
	  	{"id": "friendfeed", //ID should be unique -- don't change
	  	 "title": "FriendFeed",
	  	 "jsonURL" : "http://friendfeed.com/api/feed/search?num=[[resultsCount]]&q=[[query]]&callback=?",
	  	 "searchURL": "http://friendfeed.com/search?q=[[query]]",
	  	 "siteURL" : "http://friendfeed.com",
	  	 "queryFormatter" : "no_urls_query_formatter",
	  	 "parser" : "parse_friendfeed_json"
	  	}, //Config for Google Blog Search (RSS/ATOM Search Feed)
        {"id": "google-blog-search",
         "title": "Google Blog Search",
         "feedURL": "http://blogsearch.google.com/blogsearch_feeds?hl=en&q=[[query]]&ie=utf-8&num=5&output=atom", 
         "searchURL": "http://blogsearch.google.com/blogsearch?hl=en&ie=UTF-8&q=[[query]]&btnG=Search+Blogs",
         "siteURL": "http://blogsearch.google.com/",
         "queryFormatter" : "no_hashtags_query_formatter"
         //parser is Google AJAX Feed API 
        }
	  	/* NOTE: As of March 2010, Technorati changed how its RSS to require
           signups/subscriptions.  Also the way the RSS feeds are generated 
           now no longer works well with Google AJAX Feed API
         ,
        {"title": "Technorati",
         "feedURL": "http://feeds.technorati.com/search/[[query]]?language=n",
         "searchURL": "http://technorati.com/search/[[query]]?language=n",
         "siteURL": "http://technorati.com/",
		 "queryFormatter" : "no_hashtags_query_formatter"
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

			//initialize all our site trackers
            initSiteTrackers();
            
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

//Initialize each of the configured Site Trackers
function initSiteTrackers()
{
   	//Initialize each of the sites:
   	//update the placeholders in each of the site URLs
	jQuery.each(siteTrackers.sites, function(i, site){
		//default query formatter setting to using default_query_formatter() function, if unspecified
		if(site.queryFormatter==null || site.queryFormatter=="") site.queryFormatter="default_query_formatter";

		//reformat the mention-it query using the specified site "queryFormatter" function
		var queryForSite = eval(site.queryFormatter +"(\"" + mentionItQuery + "\")");
		
		//only continue if we still have a query (after reformatting, etc)
		if(queryForSite!=null && queryForSite!="")
		{
			//replace the [[query]] placeholder with site-specific query
			site.searchURL = site.searchURL.replace(/\[\[query\]\]/, queryForSite);
			
			//if JSON URL specified, replace both [[query]] and [[resultsCount]] placeholders
			if(site.jsonURL!=null && site.jsonURL!="")
			{
			 	site.jsonURL = site.jsonURL.replace(/\[\[query\]\]/, queryForSite);
				site.jsonURL = site.jsonURL.replace(/\[\[resultsCount\]\]/, resultsPerService);
			}
			
			//if Feed URL specified, replace just [[query]] placeholder 
			// (resultsCount will be handled by Google AJAX Feed API)
			if(site.feedURL!=null && site.feedURL!="")
			{
				site.feedURL = site.feedURL.replace(/\[\[query\]\]/, queryForSite);
			}
		}
		else
		{
			//clear out all URLs -- we don't have a query to run for this site
			site.searchURL = null;
			site.jsonURL = null;
			site.feedURL = null;
			
		}
	});
}

// ==== Query Formatters ====
// These functions are used to reformat the query text appropriately for a given site
// (Note some sites require specialized reformatting of the queries for things to work)

//The default query formatter
//  This just handles boolean ORs properly, and replaces the default placeholders
function default_query_formatter(query)
{
	//replace semicolons(;) with boolean OR (most sites use the word OR)
	// also URL escape the query
	query = query.replace(/\s*\;\s*/, " OR ");
	query = escape(query);
	
	//return the re-formatted query
	return query;
}

//This query formatter removes any hashtags from queries
//  It is for sites which mistakenly don't know how to search for hashtags (like Google Blog Search)
function no_hashtags_query_formatter(query)
{
	var partsToKeep = new Array();
	//First, split query into its subqueries
	var queryparts = query.split(";");

	//loop through each of the query terms
	jQuery.each(queryparts, function(index, value) {
		//remove any spaces at beginning of query term
		value = value.replace(/^\s*/, "");
		
		//if first character is a hash(#) then this is a hashtag
		// So, if it's not a hashtag, well keep it!
		if(value.charAt(0) != "#")
		{
			partsToKeep.push(value);
		}
	});
	
	//Now, convert the partsToKeep array back into a query (separated by semicolons)
	query = partsToKeep.join(";");
	
	//Finally, Run that new query through the default query formatter
	return default_query_formatter(query);
}

//This query formatter removes any URLs from queries
//  It is for sites which mistakenly don't know how to search for URLs well (like FriendFeed)
function no_urls_query_formatter(query)
{
	var partsToKeep = new Array();
	//First, split query into its subqueries
	var queryparts = query.split(";");

	//loop through each of the query terms
	jQuery.each(queryparts, function(index, value) {
		//remove any spaces at beginning of query term
		value = value.replace(/^\s*/, "");
		
		//If this is a URL, we won't keep it
		if(!isURL(value))
		{
			partsToKeep.push(value);
		}
	});
	
	//Now, convert the partsToKeep array back into a query (separated by semicolons)
	query = partsToKeep.join(";");
	
	//Finally, Run that new query through the default query formatter
	return default_query_formatter(query);
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
	jQuery.each(siteTrackers.sites, function(i, site){
	
		//only run JSON query if we have a jsonURL
		if(site.jsonURL!=null && site.jsonURL!="")
		{
		 	//load the JSON search URL, and evaluate the results using the appropriate parser function
			jQuery.getJSON(site.jsonURL, eval(site.parser));
		}
    });
}

// Parse the JSON results from a Twitter search into an HTML <div>
function parse_twitter_json(data)
{
  var postsHTML = '';
  var sectionHeader = '';
  
  //find the Twitter site settings via its ID
  twitConfig = getSiteConfig("twitter");
	
  //for each of the json results,
  jQuery.each(data.results,
    function(i, result)
    {
      //parse out the info we want from json
      var icon = result.profile_image_url;
      var user = result.from_user;
      var tweet = result.text;

      var tweet_id = result.id;
      var user_link = twitConfig.siteURL + '/' + user;
      var tweet_link = twitConfig.siteURL + '/' + user+'/status/'+tweet_id;
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
			+ "<a href='"+twitConfig.siteURL+"'>"+twitConfig.title+"</a>:"
			+ " [<a href='"+twitConfig.searchURL+"'>view all</a>]"
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
	
	//find the FriendFeed site settings via its ID
	ffConfig = getSiteConfig("friendfeed");
	
	//for each of the json results, 
	jQuery.each(data.entries, function(i, entry){
			
		//parse out the info we want from json
		var user = entry.user.nickname;
		var post = entry.title;

		var user_link = ffConfig.siteURL + '/' + user;
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
				user_link = ffConfig.siteURL + '/' + user;
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
        + "<a href='" + ffConfig.siteURL + "'>" + ffConfig.title + "</a>:"
        + " [<a href='" + ffConfig.searchURL +"'>view all</a>]"
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
		//Loop through our site trackers, to find the ones with Search Feeds 
		jQuery.each(siteTrackers.sites, function(i, site){
			
			//only process RSS/ATOM feed if site has a feedURL 
			if(site.feedURL!=null && site.feedURL!="")
			{
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
			}//end if feedURL not null
		}); //end jQuery.each
		
	} //end if mention-it tag found
}//end parse_feeds

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
	

// Basic check to see if a string looks like it is a URL
// If it looks like it is a URL, we can try to treat it as one
function isURL(str) 
{
    var regexUrl = new RegExp();
    // Basic Format of a URL:
    // (optionally starts with http/https/ftp)(main part must have *at least one* period)(end part allows special chars, like ? & % =)
    regexUrl.compile("^((ftp|https?)://)?[A-Za-z0-9-_]+\\.[A-Za-z0-9-_%&\?\/.=]+$");
    return regexUrl.test(str);
}


// Attempt to locate a site's configuration settings via its ID
//  If site isn't found, null is returned
function getSiteConfig(idValue)
{
	var siteFound = null;
	
	//first all our Site Tracker configurations	
	jQuery.each(siteTrackers.sites, function(i, site){
		if(site.id==idValue)
		{
			siteFound = site;
			return siteFound;
		}
	});
	
	return siteFound;
}