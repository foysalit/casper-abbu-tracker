var express = require('express');
var router = express.Router();
var _ = require('lodash');
var Scraper = require('../lib/scraper');

var sendResultResponse = function (result, res) {
	if (!_.isUndefined(res.sentResultResponse))
		return;
	
	res.header("Access-Control-Allow-Origin", "*");
  	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	res.sentResultResponse = true;
	res.json({
		result: result
	});
};

/* GET home page. */
router.get('/', function(req, res) {
	var scraper = new Scraper();

  	scraper.events.once('result', function (result) {
  		sendResultResponse(result, res);
  	});

  	setTimeout(function () {
  		sendResultResponse('none', res);
  	}, 1000*20);
});

module.exports = router;
