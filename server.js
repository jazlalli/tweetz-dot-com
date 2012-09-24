var util = require("util"),
    http = require("http"),
    url = require("url"),
    path = require("path"),  
    fs = require("fs"),
    events = require("events");
	
function load_static_file(uri, response) {
	var filename = path.join(process.cwd(), uri);
	fs.exists(filename, function(exists)
	{
		if(!exists) {  
			response.writeHead(404,
				{"Content-Type" : "text/plain"});
			response.end("404 - Not Found\n");
			return;
		}
		
		fs.readFile(filename, "binary", function(err, file) {
      if(err) {
				response.writeHead(500, {"Content-Type" : "text/plain"});
				response.end(err + "\n");
				return;
			}
      
			response.writeHead(200);  
			response.end(file, "binary");
		});
	});
}

var tweet_emitter = new events.EventEmitter();  
  
function get_tweets() {  
  var request = http.get("http://api.twitter.com/1/statuses/public_timeline.json", function(response){
    var body = "";
    
    response.addListener("data", function(data) {
      body += data;  
    });
  
    response.addListener("end", function() {
      var tweets = JSON.parse(body);  
      if(tweets.length > 0) {
        tweet_emitter.emit("tweets", tweets);  
      }  
    });      
  });
}
  
setInterval(get_tweets, 3000);
http.createServer(function(request, response)
{	
    var uri = url.parse(request.url).pathname;  
    if (uri === "/stream") 
	{
		var listener = function(tweets)
		{
			response.writeHead(200, {"Content-Type" : "text/plain" });
			response.end(JSON.stringify(tweets));
			
			clearTimeout(timeout);
		};
		
		tweet_emitter.addListener("tweets", listener);
		
		var timeout = setTimeout(function() 
		{
			response.writeHead(200, { "Content-Type" : "text/plain" });
			response.end(JSON.stringify([]));
			
			tweet_emitter.removeListener("tweets", listener);
		}, 1000);
	}
	else
	{
		load_static_file(uri, response);
	}
}).listen(8888);
  
util.puts("Server running at http://localhost:8888/"); 