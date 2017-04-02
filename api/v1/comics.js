const express = require('express');
const router = express.Router();
const eightComicModel = require('../../models/eightComicModel');
const logger = require('../../lib/logger');

router.get('/metas', function (req, res) {
	res.end(`
	usage: /metas/:offset/:limit
	`);
});

router.get('/metas/:offset/:limit', function (req, res) {
	let offset = req.params.offset;
	let limit = req.params.limit;
	eightComicModel.getMetas(offset, limit).then(rows => {
		return res.json({ data: rows });
	}).catch(reason => {
		logger.error(reason);
	});
});

router.get('/:comid_id/meta', (req, res) => {
	let comicID = req.params.comid_id;
	eightComicModel.getMetaByComicID(comicID).then(meta => {
		return res.json({ data: meta });
	}).catch(reason => {
		logger.error(reason);
	})
});

router.get('/:comid_id/chapters', (req, res) => {
	let comicID = req.params.comid_id;
	eightComicModel.getChapters(comicID).then(chapters => {
		return res.json({ data: chapters });
	}).catch(reason => {
		logger.error(reason);
	})
});

// router.get('/:comid_id/chapters/:chapter_id/meta', (req, res) => {
// 	let comicID = req.params.comid_id;
// 	eightComicModel.getChapters(comicID).then(chapters => {
// 		return res.json(chapters);
// 	}).catch(reason => {
// 		logger.error(reason);
// 	})
// });

// for mobile devices ?
router.get('/:comid_id/chapters/:chapter_id/images', (req, res) => {
	let comicID = req.params.comid_id;
	let chapterID = req.params.chapter_id;
	eightComicModel.getImages(comicID, chapterID).then(images => {
		return res.json({ data: images });
	}).catch(reason => {
		logger.error(reason);
	})
});

module.exports = router;