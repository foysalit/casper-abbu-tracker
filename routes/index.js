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
	res.json(result);
};

/* GET home page. */
router.get('/', function(req, res) {
	var scraper = new Scraper(req.query),
    sent = false;

	scraper.events.once('result', function (result) {
		var status = null;

		if (_.contains(result, 'in fase di valutazione'))
			status = 'evaluation';
		if (_.contains(result, 'stata avviata'))
			status = 'initialized';

		sendResultResponse({status: status, text: result}, res);
    	sent = true;
	});

	setTimeout(function () {
    if (!sent)
  		sendResultResponse({status: 'none', text: null}, res);
	}, 1000*20);
});

module.exports = router;
