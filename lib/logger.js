const bunyan = require('bunyan');

const logger = bunyan.createLogger({
	name: 'dyComic',
	src: true
});

process.on('SIGHUP', () => {
	logger.reopenFileStreams();
});
module.exports = logger;