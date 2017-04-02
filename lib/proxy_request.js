'use strict';
const fs = require('fs');
const URL = require('url');
const Path = require('path');
const http = require('http');
const DEFAULT_CONFIG = require('../config').lib.proxy_request;
const logger = require('./logger');
const lockFile = require('./lock_promise');
const fsp = require('./fs_promise');

const agent = new http.Agent({
	keepAlive: true,
	maxSockets: 100
});
let config, timmer;

const proxyRequest = module.exports = {
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
	},
	_extractAgedFiles: function (fileStats) {
		let now = new Date();
		return Promise.resolve({
			agedFiles: fileStats.filter(fileState => now - fileState.atime >= config.cacheAge),
			otherFiles: fileStats.filter(fileState => now - fileState.atime < config.cacheAge)
		});
	},
	_extractLruFiles: function (fileStats) {
		let totalFileSize = fileStats.reduce((prev, cur) => {
			return prev + cur.size;
		}, 0);

		if (totalFileSize > config.cacheSize || fileStats.length > config.cacheFiles) {
			// need to lru
			fileStats = fileStats.sort((a, b) => a.atime - b.atime); // sort ascending
			return Promise.resolve({
				lruFiles: fileStats.slice(0, fileStats.length / 2),
				otherFiles: fileStats.slice(fileStats.length / 2)
			});
		} else {
			return Promise.resolve({
				lruFiles: [],
				otherFiles: fileStats
			})
		}
	},
	reload: function (conf = DEFAULT_CONFIG) {
		config = conf;
		try {
			fs.mkdirSync(config.cacheDir);
		} catch (e) { }

		clearInterval(timmer);
		timmer = setInterval(() => {
			let lruLock = Path.resolve(config.cacheDir, '.lru_lock');
			lockFile.lock(lruLock).then(() => {
				return fsp.readdir(config.cacheDir);
			}).then(files => {
				// concat real path
				let filePathes = files.map(
					file => Path.resolve(config.cacheDir, file)
				);

				// do stat
				return Promise.all([
					filePathes,
					...filePathes.map(
						path => fsp.stat(path)
					)
				]);
			}).then(res => {
				// combine file path and stat result
				let filePathes = res[0];
				let stats = res.slice(1);
				return Promise.resolve(stats.map((stat, i) => {
					return Object.assign(stat, { path: filePathes[i] });
				}));
			}).then(fileStats => {
				return this._extractAgedFiles(fileStats);
			}).then(({ agedFiles, otherFiles }) => {
				return Promise.all([
					otherFiles,
					...agedFiles.map(fileStat => {
						let lockPath = fileStat.path + '.lock';
						return lockFile.lock(lockPath)
							.then(() => fsp.unlink(stat.path))
							.then(lockFile.unlock(lockPath))
					})
				]);
			}).then(stats => {
				return Promise.resolve(stats.filter(stat => stat !== undefined))
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
	}
}

proxyRequest.reload();