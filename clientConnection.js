/*
 * mySQL connection
 * 
 */

var util = require('util');
var http = require('http');
var mysql = require('mysql');

var connection = mysql.createConnection({
    socketPath: '/tmp/mysql.sock',
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'prototipoMem',
    port: '3306'
});


/*
 * Memcached
 * 
 */
var Memcached = require('memcached');
var md5 = require('md5');
var await = require('await');

//all global configurations should be applied to the .config object of the Client.
var memcached = new Memcached('localhost:11211');
console.log('Client connect.');

var query = "SELECT LastName FROM foo WHERE PersonID = 1";
var querykey = 'KEY' + md5(query);

var result = undefined;
var pre_query = new Date().getTime();
// Verify if exist querykey in memcached
await (memcached.get(querykey, function (err, data) {
	result = data;
}));


if (result) {
	// get a timestamp after running the query
	var post_memcached = new Date().getTime();
	// calculate the duration in seconds
	var durationMemcached = (post_memcached - pre_query) / 1000;
	console.log("Duration Memcached: " + durationMemcached);
	      
	console.log("<p>Data was: " + result + "</p>");
	console.log("<p>Caching success!</p><p>Retrieved data from memcached!</p>");
} else {
		var rows;
		pre_query = new Date().getTime();
		connection.connect(function(connectionError){
		    	  if(connectionError){
	    		    throw connectionError;
	    		  }
		    	  
	    		  connection.query(query, function (err, rows, fields) {
	    		        if (err) throw err;
	    		        connection.end();// mysql disconnect
	    		        
  	    		      // get a timestamp after running the query
  	    		      var post_query = new Date().getTime();
  	    		      // calculate the duration in seconds
  	    		      var durationMySql = (post_query - pre_query) / 1000;
  	    		      console.log("Duration Query Mysql: " + durationMySql);
	    		        
	    		        var LastName = '';
	    			    for(var k in rows) {
	    			    		LastName = LastName + rows[k].LastName + ',';
	    			    	}
	    			    
	    			    console.log({ LastName });
					
	    			    if(LastName){            
	    					memcached.set(querykey, LastName , 10000, function (err) { 
	    					  if(err) throw new err;
	    					});
	    					
	    					// get profile key data
	    					result = await(memcached.get(querykey, function (err, data) {
	    					  return data;
	    					}));
	    					
	    	    		        console.log( "<p>Data not found in memcached.</p><p>Data retrieved from MySQL and stored in memcached for next time.</p>");
	    			    } else {
	    			    		console.log( "<p>Data not found in memcached and Data not found in DB</p>");
	    			    }					
	    		    });
    		}); // mysql connect

}
