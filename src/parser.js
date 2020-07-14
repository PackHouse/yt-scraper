const errors = require("./errors")

function parse(body, regex) {
  return new Promise((resolve, reject) => {
    let parsedMatch
    const configMatches = body.match(regex)
    for (configMatchIndex in configMatches) {
      const configMatch = configMatches[configMatchIndex]
      const finalMatches = configMatch.match(/\{.{0,}\}/g)
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

    if (!parsedMatch) {
      reject(new errors.YTScraperMissingData)
      return
    }

    resolve(parsedMatch)
  })
}
exports.parse = parse