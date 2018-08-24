const url = require("url")
const cheerio = require("cheerio")
const request = require("request-promise-native")

const globalVariables = require("./variables")
const channel = require("./channel")

function videoInfo(videoUrl, minimalChannelInfo) {
  return new Promise((resolve, reject) => {
    // Parse the given url for processing
    var parsedUrl = url.parse(videoUrl)

    // Regex for video id used a little later, 10+ characters for future proofing
    var videoIdRegex = /^[0-9A-Za-z_-]{10,}[048AEIMQUYcgkosw]$/g
    if (globalVariables.hostnameRegex.test(parsedUrl.hostname)) {
      // Start a loop to find the "v" query and value
      var videoId = undefined
      // Split the queries and loop through them
      parsedUrl.query.split("&").forEach(query => {
        // Split each query key and value
        var splitQuery = query.split("=")
        // If the key is "v"...
        if (splitQuery[0] == "v") {
          // Verify it's a valid id
          if (videoIdRegex.test(splitQuery[1])) {
            videoId = splitQuery[1]
          }
        }
      })

      // If the loop found a valid video id
      if (videoId) {
        // Generate a fresh/clean url
        var generatedVideoUrl = "https://www.youtube.com/watch?v=" + videoId
        // Pull the source code
        request(generatedVideoUrl, {
          headers: globalVariables.globalHeaders
        })
        .then(body => {
          // Load into cheerio
          var $ = cheerio.load(body)

          // Getting all of the info
          var title = $("#eow-title").text()
          title = title.trim()

          var views = $("#watch7-views-info .watch-view-count").text()
          views = views.replace(/( |views|,)/g, "")

          var description = $("#eow-description").text()

          var likes = $(".like-button-renderer-like-button .yt-uix-button-content").first().text()

          var dislikes = $(".like-button-renderer-dislike-button .yt-uix-button-content").first().text()

          var uploadDate = $("#watch-uploader-info .watch-time-text").text().replace("Published on", "").trim()

          var channelName = $(".yt-user-info a").text()

          var channelUrl = $(".yt-user-info a").attr("href")
          var channelId = channelUrl.replace(/\/(user|channel)\//g, "")
          channelUrl = "https://www.youtube.com" + channelUrl

          // Final construction of data
          var data = {
            title: title,
            id: videoId,
            views: parseInt(views),
            description: description,
            likes: parseInt(likes),
            dislikes: parseInt(dislikes),
            uploadDate: new Date(uploadDate)
          }

          if (!minimalChannelInfo) {
            // Pull channel info to add the data object
            channel.info(channelUrl)
            .then(channelData => {
              // Add all channel info to data object
              data.channel = channelData
              // Return data
              resolve(data)
            })
            .catch(reject)
          } else {
            data.channel = {
              id: channelId,
              name: channelName,
              url: channelUrl
            }
            resolve(data)
          }
        })
        .catch(reject)
      } else reject("Invalid video ID")
    } else reject("Invalid video URL")
  })
}

exports.info = videoInfo