var video = require("./video")

test("retrives information on a YouTube video with detailed channel data", () => {
	return video.info("https://www.youtube.com/watch?v=jNQXAC9IVRw")
	.then(data => {
		expect(data).toEqual(
			expect.objectContaining({
				title: expect.any(String),
				id: expect.any(String),
				views: expect.any(Number),
				description: expect.any(String),
				likes: expect.any(Number),
				dislikes: expect.any(Number),
				uploadDate: expect.any(Date),
				channel: expect.any(Object)
			})
		)
	})

	expect.assertions(1)
})

test("retrives information on a YouTube video without detailed channel data", () => {
	return video.info("https://www.youtube.com/watch?v=jNQXAC9IVRw", true)
	.then(data => {
		expect(data).toEqual(
			expect.objectContaining({
				title: expect.any(String),
				id: expect.any(String),
				views: expect.any(Number),
				description: expect.any(String),
				likes: expect.any(Number),
				dislikes: expect.any(Number),
				uploadDate: expect.any(Date),
				channel: expect.any(Object)
			})
		)
	})

	expect.assertions(1)
})

test("trigger invalid video ID error", () => {
	return video.info("https://www.youtube.com/?v=+")
	.catch(e => expect(e).toBe("Invalid video ID"))
})

test("trigger invalid video URL error", () => {
	return video.info("https://www.youtub.com/?v=+")
	.catch(e => expect(e).toBe("Invalid video URL"))
})