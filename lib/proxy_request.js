'use strict';
const fs = require('fs');
const URL = require('url');
const Path = require('path');
const http = require('http');
const os = require('os');
const Lrufiles = require("lru-files");
const logger = require('./logger');
const lockFile = require('./lock_promise');
const fsp = require('./fs_promise');

const CACHE_DIR = Path.resolve(os.tmpdir(), '.dyComic');
try {
	fs.mkdirSync(CACHE_DIR);
} catch (e) { }
const agent = new http.Agent({
	keepAlive: true,
	maxSockets: 100
});
const fileCache = new Lrufiles({
	dir: CACHE_DIR,
	files: 1000,		// maximum number of files
	size: "1 GB",		// maximum total file size
	age: "30 Day",		// maximum last file access
	check: "1 Hour",	// interval of checks
	persist: "1 Hour"	// keep access statistics in a file, save in regular intervals
});

module.exports = {
	request: (url) => {
		let host = URL.parse(url).host;
		let hostname = URL.parse(url).hostname;
		let port = URL.parse(url).port;
		let path = URL.parse(url).path;

		let cacheName = URL.parse(url).pathname.replace(/\//g, '_')
		let cachePath = Path.resolve(CACHE_DIR, cacheName);
		let cacheLockPath = cachePath + '.lock'

		return fsp.exists(CACHE_DIR).then(exist => {
			if (!exist) {
				return new Promise((resolve, reject) => {
					fs.mkdir(CACHE_DIR, resolve);
				})
			}
		}).then(() => {
			return lockFile.lock(cacheLockPath);
		}).then(() => {
			return fsp.exists(cachePath);
		}).then((exists) => {
			if (exists) {
				return fileCache.stream(cachePath);
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
						fileCache.add(cachePath, res, function (err) {
							if (err) {
								logger.error(err);
							}
						});
						res.on('end', () => {
							return resolve(fileCache.stream(cachePath));
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
	},
	getCacheDir: function getCacheDir() {
		return CACHE_DIR;
	}
}