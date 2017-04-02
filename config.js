const os = require('os');
const path = require('path');

module.exports = {
	pgsql: {
		host: '192.168.1.106',
		port: 15432,
		database: 'crawler',
		user: 'postgres',
		password: 'aaaaaa',
		// ssl: true,
		binary: true,
		poolSize: 20
	},
	lib: {
		proxy_request: {
			cacheDir: path.resolve(os.tmpdir(), '.dyComic'),
			cacheFiles: 1000, // num of cache files
			cacheSize: 1 * 1024 * 1024 * 1024, // in bytes
			cacheAge: 30 * 86400 * 1000, // 30 days
			check: 3600 * 1000 // intercal to check
		}
	}
}