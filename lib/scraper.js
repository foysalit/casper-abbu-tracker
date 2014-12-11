'use strict';

var _ = require('lodash'),
	EventEmitter = require('events').EventEmitter,
	Request = require('request'),
	chalk = require('chalk'),
	Cheerio = require('cheerio'),
	Spooky = require('spooky');

var SiteUrl = 'https://cittadinanza.dlci.interno.it/sicitt/index2.jsp';

var Scraper = function () {
	this.events = new EventEmitter();

	this.spooky = this.initSpooky();
	this.hookSpookyEvents();

	return this;
};

Scraper.prototype.hookSpookyEvents = function () {
	this.spooky.on('error', function (e, stack) {
	    console.error(e);

	    if (stack) {
	        console.log(stack);
	    }
	});

	this.spooky.on('log', function (log) {
	    if (log.space === 'remote') {
	        console.log(log.message.replace(/ \- .*/, ''));
	    }

	    console.log(chalk.yellow('Casper Log: ') + log.message.replace(/ \- .*/, ''));
	});

	this.spooky.on('debug', function (message) {
	    console.log(chalk.cyan('Casper Debug: ') + chalk.cyan(message));
	}.bind(this));

	this.spooky.on('content', this.contentScraped.bind(this));

	this.spooky.on('screenshot', this.debugScreenshot.bind(this));
};

Scraper.prototype.contentScraped = function(html) {
	var $ = Cheerio.load(html),
		element = $('.valoreStatoPratSicitt').last();

	this.spooky.emit('debug', 'looking into result page');

	if (element.length <= 0) {
		console.log(chalk.red('element doesn\'t exist'));
		return;
	}

	if (_.contains(element.text(), 'in fase di valutazione')) {
		this.events.emit('result', 'evaluation');
	}
};

Scraper.prototype.result = function (type) {
	if (type === 'evaluation') {
		console.log('evaluation stage');
	}

	//this.spooky.exit();
};

Scraper.prototype.initSpooky = function () {
	var spooky = new Spooky({
	        child: {
	            transport: 'http'//,
	            //proxy: '192.128.101.42:9001'
	        },
	        casper: {
	            logLevel: 'debug',
	            verbose: true
	        }
	    }, this.spookyCreated.bind(this));

	return spooky;
};

Scraper.prototype.spookyCreated = function (err) {
    if (err) {
        var e = new Error('Failed to initialize SpookyJS');
        e.details = err;
        throw e;
    }

    this.start();
};

Scraper.prototype.start = function () {
	this.spooky.emit('debug', 'going to site : '+ SiteUrl);

    if (_.isUndefined(this.running))
		this.spooky.start();

	this.spooky.thenOpen(SiteUrl);
    this.spooky.then(this.steps.login);
    this.spooky.then(this.steps.seeStatus);

    if (_.isUndefined(this.running)) {
    	this.running = true;
    	this.spooky.run();
    }
};

Scraper.prototype.debugScreenshot = function (img) {
	var url = 'http://localhost:8002/';

	Request.post(url, {form:{'img' : img }}, function (err) {
		if(err){
			return console.log(chalk.red('Problem sending screenshot'));
		}

		console.log(chalk.cyan('Screenshot sent'));
	});
};

Scraper.prototype.steps = {
	login: function () {
		var selectorFound = function () {
			this.emit('debug', 'Logged in.');
			this.emit('screenshot', this.captureBase64('png'));
			this.click('a[href="lista_pratiche_sicitt"]');
		};

		var timeout = function () {
			this.emit('debug', 'selector timedout!');
		};

		this.waitForSelector('form[action="Login"]', function(){
	        this.fill('form[action="Login"]', {
	          	'userLogin': 'chowdhury.ismail.hossain@gmail.com',
	          	'passwordLogin': '123peas.polash'
	        }, true);

			this.emit('screenshot', this.captureBase64('png'));
			this.waitForSelector('a[href="lista_pratiche_sicitt"]', selectorFound, timeout, 1000 * 20);
		}, timeout, 1000 * 20);
	},

	seeStatus: function () {
		this.emit('debug', 'on result page');
		this.emit('screenshot', this.captureBase64('png'));
		this.emit('content', this.getHTML());
	}
};

module.exports = Scraper;