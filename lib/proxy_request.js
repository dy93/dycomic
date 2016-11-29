'use strict';
const fs = require('fs');
const URL = require('url');
const Path = require('path');
const http = require('http');
const os = require('os');
// const Lrufiles = require("lru-files");
const config = require('../config').lib.proxy_request;
const logger = require('./logger');
const lockFile = require('./lock_promise');
const fsp = require('./fs_promise');

try {
	fs.mkdirSync(config.cacheDir);
} catch (e) { }
const agent = new http.Agent({
	keepAlive: true,
	maxSockets: 100
});

setInterval(() => {
	let lruLock = Path.resolve(config.cacheDir, '.lru_lock');
	lockFile.lock(lruLock).then(() => {
		return fsp.readdir(config.cacheDir);
	}).then(files => {
		return Promise.all(
			files.map(
				file => fsp.stat(Path.resolve(config.cacheDir, file))
			)
		);
	}).then(stats => {
		let now = new Date();
		return Promise.all(
			stats.filter((stat) => {
				return now - stat.atime >= config.cacheAge;
			}).map((stat) => {
				let lockPath = stat.path + '.lock';
				return lockFile.lock(lockPath)
					.then(() => fsp.unlink(stat.path))
					.then(lockFile.unlock(lockPath))
			})
		).then(() => {
			return stats.filter((stat) => {
				return now - stat.atime < config.cacheAge;
			})
		})
	}).then(stats => {
		let totalFileSize = stats.reduce((prev, cur) => {
			return prev + cur.size;
		}, 0);

		if (totalFileSize > config.cacheSize || stats.length > config.cacheFiles) {
			// need to lru
			return Promise.all(stats.sort((a, b) => a.atime - b.atime).slice(stats.length / 2).map((stat) => {
				let lockPath = stat.path + '.lock';
				return lockFile.lock(lockPath)
					.then(() => fsp.unlink(stat.path))
					.then(lockFile.unlock(lockPath))
			}))
		}
	}).then(() => {
		return lockFile.unlock(lruLock)
	})
}, config.check);

module.exports = {
	request: (url) => {
		let host = URL.parse(url).host;
		let hostname = URL.parse(url).hostname;
		let port = URL.parse(url).port;
		let path = URL.parse(url).path;

		let cacheName = URL.parse(url).pathname.replace(/\//g, '_')
		let cachePath = Path.resolve(config.cacheDir, cacheName);
		let cacheLockPath = cachePath + '.lock'

		return lockFile.lock(cacheLockPath).then(() => {
			return fsp.exists(cachePath);
		}).then((exists) => {
			if (exists) {
				return fs.createReadStream(cachePath);
			} else {
				return new Promise((resolve, reject) => {
					http.request({
						hostname: hostname,
						port: port,
						path: path,
						headers: {
							'Accept': 'image/webp,image/*,*/*;q=0.8',
							'Accept-Encoding': 'gzip, deflate, sdch',
							'Accept-Language': 'zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4',
							'Cache-Control': 'no-cache',
							'Connection': 'keep-alive',
							'Host': host,
							'Pragma': 'no-cache',
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.99 Safari/537.36'
						},
						agent: agent
					}, res => {
						res.pipe(fs.createWriteStream(cachePath));
						res.on('end', () => {
							return resolve(fs.createReadStream(cachePath));
						});
					}).on('error', e => {
						return reject(e);
					}).end();
				});
			}
		}).then(rStream => {
			lockFile.unlock(cacheLockPath);
			return rStream;
		}).catch(reason => {
			logger.error(reason);
			lockFile.unlock(cacheLockPath);
		})
	}
}