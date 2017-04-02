# API
## GET /api/v1/comics/metas/:offset/:limit
query string: not yet implement
```json
{
	"data": [
		{
			"id": 1,
			"title": "標題",
			"title_aka": "標，標題",
			"actor": "演員",
			"kind": "熱血",
			"author": "作者",
			"total": 169,
			"is_finished": false,
			"last_update": "2016-12-07T16:00:00.000Z",
			"vote_count": 1000,
			"total_score": 9988,
			"monthly_score": 1234,
			"description": "這是一個故事",
			"thumbnail": "http://www.comicbus.com/pics/0/103.jpg"
		},
		{
			...
		}
	]
}
```

## GET /api/v1/comics/:comic_id/meta
```
{
	"data": {
		"id": 1,
		"title": "標題",
		"title_aka": "標，標題",
		"actor": "演員",
		"kind": "熱血",
		"author": "作者",
		"total": 169,
		"is_finished": false,
		"last_update": "2016-12-07T16:00:00.000Z",
		"vote_count": 1000,
		"total_score": 9988,
		"monthly_score": 1234,
		"description": "這是一個故事",
		"thumbnail": "http://www.comicbus.com/pics/0/103.jpg"
	}
}
```

## GET /api/v1/comics/:comic_id/chapters
```
{
	"data": [
		{
			id: 1,
			title: "第01卷",
			comic_id: 103
		},
		{
			id: 2,
			title: "第02卷",
			comic_id: 103
		}
	]
}
```

## GET /api/v1/comics/:comic\_id/chapters/:cahpter\_id/images
```
{
	"data": [
		"http://ig3.6comic.com:99/2/103/1/001_8a7.jpg",
		"http://img3.6comic.com:99/2/103/1/002_tgk.jpg",
		"http://img3.6comic.com:99/2/103/1/003_hpa.jpg",
		"http://img3.6comic.com:99/2/103/1/004_vvw.jpg",
	]
}
```

# not yet implement

## GET /img/thumbnail/{comic_id}

## GET /img/{comic_id}/{chapter_id}/{page}