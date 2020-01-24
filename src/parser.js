const cheerio = require("cheerio")
const errors = require("./errors")

function parse(body) {
  return new Promise((resolve, reject) => {
    const $ = cheerio(body)
    let parsedMatch
    const scriptElements = $.find("script").toArray()
    for (index in scriptElements) {
      const element = scriptElements[index]
      const text = cheerio(element).contents().first().text()
      const configMatches = text.match(/ytplayer.config\s?=\s?\{.{0,}\};ytplayer/gm)
      for (configMatchIndex in configMatches) {
        const configMatch = configMatches[configMatchIndex]

        const finalMatches = configMatch.match(/\{.{0,}\}/gm)
        for (finalMatchIndex in finalMatches) {
          const finalMatch = finalMatches[finalMatchIndex]
          try {
            parsedMatch = JSON.parse(finalMatch)
            break
          } catch (err) {
            continue
          }
        }
      }
    }

    if (!parsedMatch) {
      reject(new errors.YTScraperMissingData)
      return
    }

    resolve({
      match: parsedMatch,
      dom: $
    })
  })
}
exports.parse = parse