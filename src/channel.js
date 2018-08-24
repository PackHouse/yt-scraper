const url = require("url")
const cheerio = require("cheerio")
const request = require("request-promise-native")

const globalVariables = require("./variables")

function channelInfo(channelUrl) {
  return new Promise((resolve, reject) => {
    // Parse url for processing
    var parsedUrl = url.parse(channelUrl)
    // Regex for checking a valid channel id
    // youtube channel id should contains 0 & _ character.
    var channelPathRegex = /^\/(user|channel)\/[_A-Za-z0-9-]{1,}$/g

    // Checking the type of channel url, `channel` or `url`
    var channelUrlType = "channel"
    if (/^\/user/g.test(parsedUrl.pathname)) {
      channelUrlType = "user"
    }

    // If valid YouTube url
    if (globalVariables.hostnameRegex.test(parsedUrl.hostname)) {
      // If valid channel id
      if (channelPathRegex.test(parsedUrl.pathname)) {
        channelId = parsedUrl.pathname.replace(/\/(user|channel)\//g, "")

        // Generate a fresh/clean channel url
        var generatedChannelUrl = "https://www.youtube.com/" + channelUrlType + "/" + channelId + "/about"
        request(generatedChannelUrl, {
          headers: globalVariables.globalHeaders
        })
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

exports.info = channelInfo