import Trakt from 'trakt.tv';

const trakt = new Trakt({
  client_id: process.env.client_id,
  client_secret: process.env.client_secret
});

async function removeDuplicates() {
  const history = await trakt.sync.history.get({ type: 'episodes', limit: 1000 });
  console.log(`Fetched ${history.length} episodes.`);

  const episodes = history.reduce((acc, entry) => {
    const episodeId = entry.episode.ids.trakt;
    if (!acc[episodeId]) acc[episodeId] = [];
    acc[episodeId].push(entry);
    return acc;
  }, {});

  const toRemove = Object.values(episodes).reduce((acc, entries) => {
    if (entries.length === 1) return acc;
    entries.sort((a, b) => new Date(a.watched_at) - new Date(b.watched_at));
    return acc.concat(entries.slice(1));
  }, []);

  console.log(`Found ${toRemove.length} extra entries to remove.`);

  if (toRemove.length == 0) return
  trakt.sync.history.remove({ ids: toRemove.map(entry => entry.id) });
}

trakt.import_token({ access_token: process.env.access_token })
  .then(removeDuplicates)