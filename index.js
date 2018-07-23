const url = require("url")
const cheerio = require("cheerio")
const request = require("request-promise-native")

// Regex to verify YouTube hostname is valid
var hostnameRegex = /^(www.)?youtube.com$/

function channelInfo(channelUrl) {
  return new Promise((resolve, reject) => {
    // Parse url for processing
    var parsedUrl = url.parse(channelUrl)
    // Regex for checking a valid channel id
    var channelPathRegex = /^\/(user|channel)\/[A-Za-z1-9-]{1,}$/g

    // Checking the type of channel url, `channel` or `url`
    var channelUrlType = "channel"
    if (/^\/user/g.test(parsedUrl.pathname)) {
      channelUrlType = "user"
    }

    // If valid YouTube url
    if (hostnameRegex.test(parsedUrl.hostname)) {
      // If valid channel id
      if (channelPathRegex.test(parsedUrl.pathname)) {
        channelId = parsedUrl.pathname.replace(/\/(user|channel)\//g, "")

        // Generate a fresh/clean channel url
        var generatedChannelUrl = "https://www.youtube.com/" + channelUrlType + "/" + channelId + "/about"
        request(generatedChannelUrl)
        .then(body => {
          var $ = cheerio.load(body)

          // Data variable returned
          var data = { id: channelId }

          // Channel name
          var name = $(".qualified-channel-title-text a").text()
          data.name = name

          // All 3 elements we need all come under about-stat class
          $(".about-stat").each((index, element) => {
            var elementText = $(element).text()
            if (/subscribers/g.test(elementText)) {
              // Subscribers
              var subscribers = elementText.replace(/[^1-9]/g, "")
              data.subscribers = parseInt(subscribers)
            } else if (/views/g.test(elementText)) {
              // Views
              var views = elementText.replace(/[^1-9]/g, "")
              data.views = parseInt(views)
            } else if (/Joined/g.test(elementText)) {
              // Joined date
              var joined = elementText.replace(/Joined /g, "")
              data.joined = new Date(joined)
            }
          })

          data.url = generatedChannelUrl

          var description = $(".about-description pre").text()
          data.description = description

          // Return the data
          resolve(data)
        })
        .catch(reject)
      } else reject("Invalid channel URL")
    } else reject("Invalid channel URL")
  })
}

exports.channelInfo = channelInfo

function videoInfo(videoUrl) {
  return new Promise((resolve, reject) => {
    // Parse the given url for processing
    var parsedUrl = url.parse(videoUrl)

    // Regex for video id used a little later, 10+ characters for future proofing
    var videoIdRegex = /^[0-9A-Za-z_-]{10,}[048AEIMQUYcgkosw]$/g
    if (hostnameRegex.test(parsedUrl.hostname)) {
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
        request(generatedVideoUrl)
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

          var author = $(".yt-user-info a").text()

          var authorUrl = $(".yt-user-info a").attr("href")
          authorUrl = "https://www.youtube.com" + authorUrl

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

          // Pull channel info to add the data object
          channelInfo(authorUrl)
          .then(channelData => {
            // Add all channel info to data object
            data.channel = channelData
            // Return data
            resolve(data)
          })
          .catch(reject)
        })
        .catch(reject)
      } else reject("Invalid video ID")
    } else reject("Invalid video URL")
  })
}

videoInfo("https://www.youtube.com/watch?v=dd_FBkfkcaM")
.then(data => {
  console.log(data)
})

exports.videoInfo = videoInfo
