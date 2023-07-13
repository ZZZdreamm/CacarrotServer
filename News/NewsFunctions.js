import NewsAPI from "newsapi";

export async function getNews(searchQuery) {
  const apiKey = "1f1790b27875460b9a3b23db3432160f";
  const newsapi = new NewsAPI(apiKey);
  var currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - 30);
  const limitDateInString = currentDate.toISOString().split("T")[0];
  return new Promise((resolve) => {
    newsapi.v2
    .everything({
      q: searchQuery,
      from: limitDateInString,
      sortBy: "relevancy",
      language:'en'
    })
    .then((response) => {
      resolve(response)
    })
    .catch((err) => {
      console.log(err);
    });
  })

}

