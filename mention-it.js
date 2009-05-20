// Technologies used:
//    jQuery:   http://jquery.com/
//    Google AJAX Feed API: http://code.google.com/apis/ajaxfeeds/

//Config
var resultsPerService = 5;
var twitterEnabled = true;
var friendFeedEnabled = true;

var headingPreface = "Recent mentions via";

// List of all search feeds formatted in JSON
// [[query]] is the placeholder for the Query text
var searchFeeds = { 
    "sites":
      [
        {"title": "Google Blog Search",
         "feedURL": "http://blogsearch.google.com/blogsearch_feeds?hl=en&q=[[query]]&ie=utf-8&num=5&output=atom", 
         "searchURL": "http://blogsearch.google.com/blogsearch?hl=en&ie=UTF-8&q=[[query]]&btnG=Search+Blogs",
         "siteURL": "http://blogsearch.google.com/",
         "booleanOR": "OR"
        },
        {"title": "Technorati",
         "feedURL": "http://feeds.technorati.com/search/[[query]]?language=n",
         "searchURL": "http://technorati.com/search/[[query]]?language=n",
         "siteURL": "http://technorati.com/",
         "booleanOR": "OR"
        }
      ]
}

// Not required, but can be useful to contact you if Google has problems
// with your usage of Google AJAX Feed API. For more info, see:
//    http://code.google.com/apis/ajaxfeeds/key.html
var googleAJAXFeedKey = "";



// Global variables
var mentionItTag = null;
var mentionItQuery;

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
            // Query specified in the HTML tag's title
            mentionItQuery = mentionItTag.attr("title");

            //Initialize each of the sites:
            //update the query placeholder in each of the site URLs
            jQuery.each(searchFeeds.sites, function(i, site){
                var queryForSite = mentionItQuery;

                //default boolean OR to just "OR" if unspecified for a site
                if(site.booleanOR==null || site.booleanOR=="") site.booleanOR="OR";

                //replace semicolons(;) with boolean OR
                queryForSite = mentionItQuery.replace(/\s*\;\s*/, " " + site.booleanOR + " ");

                //replace the [[query]] placeholder with the site-specific query
                site.feedURL = site.feedURL.replace(/\[\[query\]\]/, queryForSite);
                site.searchURL = site.searchURL.replace(/\[\[query\]\]/, queryForSite);
            });

            //For everything else (Twitter/FF, etc), replace semicolons(;) with boolean OR
            mentionItQuery = mentionItQuery.replace(/\s*\;\s*/, " OR ");
        }//end if mentionItTag found
    });


// Once document finishes loading, call loadJSONTrackers()
jQuery(document).ready(loadJSONTrackers);

// Also load all Feed (RSS/ATOM) Trackers, using Google AJAX API
loadFeedTrackers();

// Load all of our web trackers to search for mentions out on the web.
function loadJSONTrackers()
{
	  // Only contine if the 'mention-it' tag exists
	  if(tagExists(mentionItTag))
	  {
			  //Add search API call for Twitter
			  if(twitterEnabled)
			  {     
				var searchURL = "http://search.twitter.com/search.json?rpp="+resultsPerService+"&q="+mentionItQuery+"&callback=?";
				//send off search and parse response using parse_twitter_json()
				jQuery.getJSON(searchURL, parse_twitter_json);
			  }

			  //Add search API call for FriendFeed
			  if(friendFeedEnabled)
			  {
				//NOTE: append '-service:twitter' on query in order to filter out twitter-based results
				searchURL = 'http://friendfeed.com/api/feed/search?num='+resultsPerService+'&q=' + mentionItQuery + '+-service%3Atwitter&callback=?';
				//send off search and parse response using parse_friendfeed_json()
				jQuery.getJSON(searchURL, parse_friendfeed_json);
			  }
	  }
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
	
