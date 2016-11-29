const fs = require('fs-extra');

module.exports = {
	exists: function exists(path) {
		return new Promise((resolve, reject) => {
			fs.stat(path, (err, stats) => {
				if (err) {
					return resolve(false);
				}
				return resolve(true);
			})
		});
	},
	readdir: function readdir(path) {
		return new Promise((resolve, reject) => {
			fs.readdir(path, (err, files) => {
				if (err) {
					return reject(err);
				}
				return resolve(files);
			})
		})
	},
	mkdirp: function mkdirp(path) {
		return new Promise((resolve, reject) => {
			fs.mkdirp(path, err => {
				if (err) {
					return reject(err);
				}
				return resolve();
			})
		})
	},
	stat: function stat(path) {
		return new Promise((resolve, reject) => {
			return fs.stat(path, (err, stat) => {
				if (err) {
					return reject(err);
				}
				stat.path = path;
				return resolve(stat);
			});
		})
	},
	unlink: function unlink(path) {
		return new Promise((resolve) => {
			return fs.unlink(path, resolve);
		})
	}
}