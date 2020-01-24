const ytScraper = require("../index")

ytScraper.videoInfo("https://www.youtube.com/watch?v=jNQXAC9IVRw")
.then(data => {
	console.log("=== VIDEO INFO ===")
	console.log(data)
})
.catch(err => {
	console.log("=== ERROR ===")
	console.log(err)
	console.log("Please make sure to run `npm i`. If this error persists and cannot be explained please report an issue: https://github.com/harrego/yt-scraper/issues")
})