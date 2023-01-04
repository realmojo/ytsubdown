const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);
const axios = require("axios");

const port = process.env.PORT || 3000;
server.setTimeout(500000);

app.use(cors());

app.get("/", async (req, res) => {
  console.log("hello world");
  res.send("ok");
});

const getYoutubeTransKey = (html) => {
  const startOf = html.indexOf("INNERTUBE_API_KEY");

  const t = html.substr(startOf, 100);
  const d = t.split('KEY":"');
  const a = d[1].split('","');

  return a[0];
};

const getYoutubeTransParams = (html) => {
  const startOf = html.indexOf("getTranscriptEndpoint");

  const t = html.substr(startOf, 300);
  const d = t.split('"params":"');
  const a = d[1].split('"}}}}');

  return a[0];
};

const getYoutubeTransScriptItems = (obj) => {
  const { actions } = obj;
  const scriptItems =
    actions[0].updateEngagementPanelAction.content.transcriptRenderer.content
      .transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer
      .initialSegments;

  const items = [];
  let full = "";
  for (const item of scriptItems) {
    items.push({
      time: item.transcriptSegmentRenderer.startTimeText.simpleText,
      text: item.transcriptSegmentRenderer.snippet.runs[0].text,
    });
    full += `${item.transcriptSegmentRenderer.snippet.runs[0].text} `;
  }
  return { items, full };
};

const getYoutubeTransUrl = (key) => {
  return `https://www.youtube.com/youtubei/v1/get_transcript?key=${key}&prettyPrint=false`;
};

app.get("/ytscript", async (req, res) => {
  console.log(req.headers);
  try {
    if (req.headers.host !== "ytsubdown.f5game.co.kr") {
      return res.status(200).send({ message: "no hack" });
    }
    const { url } = req.query;
    if (!url) {
      throw new Error("error");
    }
    const ytRes = await axios.get(url);
    const html = ytRes.data;

    const key = getYoutubeTransKey(html);
    const params = getYoutubeTransParams(html);

    const data = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20230103.01.00",
        },
      },
      params,
    };
    const response = await axios.post(getYoutubeTransUrl(key), data);

    const scriptItems = getYoutubeTransScriptItems(response.data);

    return res.status(200).send(scriptItems);
  } catch (e) {
    return res.status(200).send({ message: "no data" });
  }
});

server.listen(port, () => {
  console.log(`ytscriptdownloader Server Open Port: ${port}`);
});